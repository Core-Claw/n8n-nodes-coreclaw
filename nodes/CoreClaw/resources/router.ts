import type { IDataObject, IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError, sleep } from 'n8n-workflow';

import { coreClawApiRequest, parseJsonParameter } from '../GenericFunctions';
import {
	CORECLAW_FAILED_RUN_STATUSES,
	CORECLAW_TERMINAL_RUN_STATUSES,
} from '../constants';
import type { CoreClawEndpointSpec, CoreClawRequestArgs } from '../types';
import { getEndpointSpec } from './endpointSpecs';
import { extractItems, nextOffset } from './pagination';
import { compactBody, prepareRunWorkerBody } from './runInput';

const RETURN_ALL_MAX_ROWS = 10000;
const PAGE_SIZE_LIMIT = 100;
const WAIT_FOR_FINISH_MAX_ATTEMPTS = 120;
const WAIT_FOR_FINISH_POLL_INTERVAL_MS = 2000;
const ROUTER_NODE: INode = {
	id: 'coreclaw-router',
	name: 'CoreClaw',
	type: 'n8n-nodes-coreclaw.coreClaw',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

export function replacePathParams(path: string, params: IDataObject): string {
	return path.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURIComponent(String(params[name] ?? '')));
}

export function buildRequestFromSpec(
	spec: CoreClawEndpointSpec,
	params: IDataObject,
	node: INode = ROUTER_NODE,
): CoreClawRequestArgs {
	const pathParams: IDataObject = {};
	const qs: IDataObject = {};
	const body: IDataObject = {};

	for (const param of spec.params) {
		const value = params[param.name];
		if (param.location === 'path' && param.required && isBlank(value)) {
			throw new NodeOperationError(node, `${param.displayName} is required`);
		}
		if (isBlank(value)) continue;

		if (param.location === 'path') pathParams[param.name] = value;
		if (param.location === 'query') qs[param.name] = value;
		if (param.location === 'body') body[param.name] = value;
	}

	const preparedBody =
		spec.resource === 'worker' && spec.operation === 'run'
			? prepareRunWorkerBody(body)
			: compactBody(body);

	return {
		method: spec.method,
		path: replacePathParams(spec.path, pathParams),
		qs,
		body: preparedBody,
		retrySafe: spec.method === 'GET',
	};
}

export async function routeCoreClawOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', itemIndex) as string;
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const spec = getEndpointSpec(resource, operation);

	if (!spec) {
		throw new NodeOperationError(this.getNode(), `Unknown CoreClaw operation ${resource}.${operation}`, {
			itemIndex,
		});
	}

	if (spec.composite === 'runAndGetResults') {
		return executeRunAndGetResults.call(this, spec, itemIndex);
	}

	const params = collectParams.call(this, spec, itemIndex);
	const returnAll = spec.supportsReturnAll && (this.getNodeParameter('returnAll', itemIndex, false) as boolean);

	let data = returnAll
		? await requestAllPages.call(this, spec, params, RETURN_ALL_MAX_ROWS)
		: await coreClawApiRequest.call(this, buildRequestFromSpec(spec, params, this.getNode()));
	if (spec.supportsWaitForFinish && params.waitForFinish === true && !returnAll) {
		data = await waitForRunToFinish.call(this, data, itemIndex);
	}

	const outputRows = spec.returnsList ? extractItems(data) : undefined;
	if (outputRows) return this.helpers.returnJsonArray(outputRows);
	return [{ json: (data as IDataObject) ?? {} }];
}

/**
 * Composite operation: run a worker / worker task / rerun, poll the run until
 * it reaches a terminal status, then return the run result rows as n8n items.
 *
 * Mirrors Apify's "Run Task and get dataset items" — one node, one click, the
 * user gets the data out instead of wiring Run → Get → List Results.
 *
 * The run is always submitted asynchronously (is_async=true) so we can poll
 * with GET /worker-runs/{runId}. When the run finishes unsuccessfully we
 * surface the run log so the user can see why it failed.
 */
async function executeRunAndGetResults(
	this: IExecuteFunctions,
	spec: CoreClawEndpointSpec,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const triggerSpec = spec.compositeTrigger;
	if (!triggerSpec) {
		throw new NodeOperationError(
			this.getNode(),
			`Composite operation ${spec.resource}.${spec.operation} is missing its trigger spec`,
			{ itemIndex },
		);
	}

	const params = collectParams.call(this, spec, itemIndex);
	// Composite operations always poll client-side; never ask the backend to block.
	params.is_async = true;

	const triggerRequest = buildRequestFromSpec(triggerSpec, params, this.getNode());
	const runData = (await coreClawApiRequest.call(this, triggerRequest)) as IDataObject;
	const terminalRun = (await waitForRunToFinish.call(this, runData, itemIndex)) as IDataObject | undefined;
	const status = String(terminalRun?.status ?? '').toLowerCase();

	if ((CORECLAW_FAILED_RUN_STATUSES as readonly string[]).includes(status)) {
		const runId = extractRunId(terminalRun) || extractRunId(runData);
		const log = runId
			? await safeFetchRunLog.call(this, runId)
			: undefined;
		const errMsg = String(terminalRun?.err_msg ?? '') || `Run finished with status ${status}`;
		throw new NodeOperationError(this.getNode(), `CoreClaw run ${runId || ''} ${status}: ${errMsg}`.trim(), {
			itemIndex,
			description: log ? `Run log:\n${log}` : 'No run log was available.',
		});
	}

	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const runId = extractRunId(terminalRun) || extractRunId(runData);
	if (!runId) {
		throw new NodeOperationError(this.getNode(), 'CoreClaw run did not return a run id', { itemIndex });
	}

	const rows = returnAll
		? await fetchAllResultRows.call(this, runId, RETURN_ALL_MAX_ROWS)
		: await fetchResultPage.call(this, runId, Number(params.offset ?? 0), Number(params.limit ?? 50));

	return this.helpers.returnJsonArray(rows);
}

async function fetchResultPage(
	this: IExecuteFunctions,
	runId: string,
	offset: number,
	limit: number,
): Promise<IDataObject[]> {
	const data = await coreClawApiRequest.call(this, {
		method: 'GET',
		path: `/api/v2/worker-runs/${encodeURIComponent(runId)}/result`,
		qs: { offset, limit: Math.min(PAGE_SIZE_LIMIT, limit) },
		retrySafe: true,
	});
	return extractItems(data) ?? [];
}

async function fetchAllResultRows(
	this: IExecuteFunctions,
	runId: string,
	maxRows: number,
): Promise<IDataObject[]> {
	const rows: IDataObject[] = [];
	let offset = 0;

	while (rows.length < maxRows) {
		const pageRows = await fetchResultPage.call(this, runId, offset, Math.min(PAGE_SIZE_LIMIT, maxRows - rows.length));
		if (pageRows.length === 0) break;
		rows.push(...pageRows);
		if (pageRows.length < PAGE_SIZE_LIMIT) break;
		offset = nextOffset(offset, pageRows);
	}

	return rows.slice(0, maxRows);
}

async function safeFetchRunLog(this: IExecuteFunctions, runId: string): Promise<string | undefined> {
	try {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: `/api/v2/worker-runs/${encodeURIComponent(runId)}/log`,
			retrySafe: true,
		});
		if (typeof data === 'string') return data;
		if (isDataObject(data)) {
			const log = data.log ?? data.content ?? data.data;
			if (typeof log === 'string') return log;
			try {
				return JSON.stringify(data);
			} catch {
				return undefined;
			}
		}
		return undefined;
	} catch {
		return undefined;
	}
}

async function waitForRunToFinish(
	this: IExecuteFunctions,
	initialData: unknown,
	itemIndex: number,
): Promise<unknown> {
	if (isTerminalRunData(initialData)) return initialData;

	const runId = extractRunId(initialData);
	if (!runId) return initialData;

	let latestData: unknown = initialData;
	for (let attempt = 0; attempt < WAIT_FOR_FINISH_MAX_ATTEMPTS; attempt++) {
		latestData = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: `/api/v2/worker-runs/${encodeURIComponent(runId)}`,
			retrySafe: true,
		});

		if (isTerminalRunData(latestData)) return latestData;
		if (attempt < WAIT_FOR_FINISH_MAX_ATTEMPTS - 1) {
			await sleep(WAIT_FOR_FINISH_POLL_INTERVAL_MS);
		}
	}

	throw new NodeOperationError(this.getNode(), `CoreClaw run ${runId} did not finish before polling timed out`, {
		itemIndex,
	});
}

function extractRunId(data: unknown): string {
	if (!isDataObject(data)) return '';

	return String(data.run_slug ?? data.run_id ?? data.slug ?? data.id ?? '').trim();
}

function isTerminalRunData(data: unknown): boolean {
	if (!isDataObject(data)) return false;

	const status = String(data.status ?? data.run_status ?? '').toLowerCase();
	return (CORECLAW_TERMINAL_RUN_STATUSES as readonly string[]).includes(status);
}

function isDataObject(data: unknown): data is IDataObject {
	return data !== null && typeof data === 'object' && !Array.isArray(data);
}

function isBlank(value: unknown): boolean {
	return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function collectParams(this: IExecuteFunctions, spec: CoreClawEndpointSpec, itemIndex: number): IDataObject {
	const params: IDataObject = {};

	for (const param of spec.params) {
		const rawValue = this.getNodeParameter(param.name, itemIndex, param.default ?? '', {
			extractValue: true,
		}) as unknown;
		if (param.type === 'json') {
			params[param.name] = parseJsonParameter.call(this, rawValue, param.displayName, itemIndex) as IDataObject;
		} else {
			params[param.name] = rawValue as IDataObject[string];
		}
	}

	if (spec.supportsWaitForFinish) {
		params.waitForFinish = this.getNodeParameter('waitForFinish', itemIndex, false) as boolean;
	}

	return params;
}

async function requestAllPages(
	this: IExecuteFunctions,
	spec: CoreClawEndpointSpec,
	params: IDataObject,
	maxRows: number,
): Promise<IDataObject[]> {
	const rows: IDataObject[] = [];
	let offset = Number(params.offset ?? 0);

	while (rows.length < maxRows) {
		const request = buildRequestFromSpec(spec, {
			...params,
			offset,
			limit: Math.min(PAGE_SIZE_LIMIT, maxRows - rows.length),
		}, this.getNode());
		const data = await coreClawApiRequest.call(this, request);
		const pageRows = extractItems(data);
		if (!pageRows || pageRows.length === 0) break;
		rows.push(...pageRows);
		if (pageRows.length < Number(request.qs?.limit ?? request.body?.limit ?? PAGE_SIZE_LIMIT)) break;
		offset = nextOffset(offset, pageRows);
	}

	return rows.slice(0, maxRows);
}
