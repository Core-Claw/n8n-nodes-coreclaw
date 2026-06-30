import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { coreClawApiRequest, parseJsonParameter } from '../GenericFunctions';
import type { CoreClawEndpointSpec, CoreClawRequestArgs } from '../types';
import { getEndpointSpec } from './endpointSpecs';
import { extractItems, nextOffset } from './pagination';
import { compactBody, prepareRunWorkerBody } from './runInput';

export function replacePathParams(path: string, params: IDataObject): string {
	return path.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURIComponent(String(params[name] ?? '')));
}

export function buildRequestFromSpec(
	spec: CoreClawEndpointSpec,
	params: IDataObject,
): CoreClawRequestArgs {
	const pathParams: IDataObject = {};
	const qs: IDataObject = {};
	const body: IDataObject = {};

	for (const param of spec.params) {
		const value = params[param.name];
		if (value === undefined || value === null || value === '') continue;

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

	const params = collectParams.call(this, spec, itemIndex);
	const returnAll = spec.supportsReturnAll && (this.getNodeParameter('returnAll', itemIndex, false) as boolean);
	const limit = spec.supportsReturnAll
		? (this.getNodeParameter('limit', itemIndex, 20) as number)
		: undefined;

	const data = returnAll
		? await requestAllPages.call(this, spec, params, limit ?? 20)
		: await coreClawApiRequest.call(this, buildRequestFromSpec(spec, params));

	const outputRows = spec.returnsList ? extractItems(data) : undefined;
	if (outputRows) return this.helpers.returnJsonArray(outputRows);
	return [{ json: (data as IDataObject) ?? {} }];
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
			limit: Math.min(100, maxRows - rows.length),
		});
		const data = await coreClawApiRequest.call(this, request);
		const pageRows = extractItems(data);
		if (!pageRows || pageRows.length === 0) break;
		rows.push(...pageRows);
		if (pageRows.length < Number(request.qs?.limit ?? request.body?.limit ?? 100)) break;
		offset = nextOffset(offset, pageRows);
	}

	return rows.slice(0, maxRows);
}
