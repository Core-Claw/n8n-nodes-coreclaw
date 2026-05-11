import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	coreClawApiRequest,
	parseJsonParameter,
	splitCsv,
} from './GenericFunctions';
import { scraperOperations, scraperFields } from './descriptions/ScraperDescription';
import { runOperations, runFields } from './descriptions/RunDescription';
import { taskOperations, taskFields } from './descriptions/TaskDescription';
import { accountOperations, accountFields } from './descriptions/AccountDescription';

export class CoreClaw implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CoreClaw',
		name: 'coreClaw',
		icon: { light: 'file:coreclaw.svg', dark: 'file:coreclaw.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Run scrapers on the CoreClaw marketplace, fetch results, and manage runs from n8n',
		defaults: {
			name: 'CoreClaw',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'coreClawApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Run', value: 'run' },
					{ name: 'Scraper', value: 'scraper' },
					{ name: 'Task', value: 'task' },
				],
				default: 'scraper',
			},
			...scraperOperations,
			...scraperFields,
			...runOperations,
			...runFields,
			...taskOperations,
			...taskFields,
			...accountOperations,
			...accountFields,
		],
	};

	methods = {
		listSearch: {
			async searchScrapers(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const data = (await coreClawApiRequest.call(
					this,
					'GET',
					'/api/store',
					{},
					{ search: filter ?? '', limit: 50 },
				));

				const items = normalizeScraperSearchResults(data);

				return {
					results: items
						.map((item) => {
							const slug = (item.slug as string) || '';
							const title = (item.title as string) || '';
							const description = (item.description as string) || undefined;
							return {
								name: title || slug || '(unnamed)',
								value: slug,
								description,
								url: slug ? `https://coreclaw.com/store/${slug}` : undefined,
							};
						})
						.filter((entry) => entry.value !== ''),
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let result: unknown;
				let pushAsList = false;

				// ===================== SCRAPER =====================
				if (resource === 'scraper') {
					if (operation === 'search') {
						const query = this.getNodeParameter('query', i, '') as string;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						result = await coreClawApiRequest.call(
							this,
							'GET',
							'/api/store',
							{},
							{ search: query, limit },
						);
						result = normalizeScraperSearchResults(result);
						pushAsList = true;
					} else if (operation === 'getDetails') {
						const slug = this.getNodeParameter('scraperSlug', i, '', {
							extractValue: true,
						}) as string;
						result = await coreClawApiRequest.call(
							this,
							'GET',
							'/api/scraper',
							{},
							{ slug },
						);
					} else if (operation === 'run') {
						const slug = this.getNodeParameter('scraperSlug', i, '', {
							extractValue: true,
						}) as string;
						const version = this.getNodeParameter('version', i) as string;
						const customRaw = this.getNodeParameter('customParams', i) as unknown;
						const additional = this.getNodeParameter(
							'additionalFields',
							i,
							{},
						) as IDataObject;

						const customParams = parseJsonParameter.call(
							this,
							customRaw,
							'Custom Parameters',
							i,
						);
						if (customParams === undefined) {
							throw new NodeOperationError(
								this.getNode(),
								'Custom Parameters is required for Run Scraper',
								{ itemIndex: i },
							);
						}

						const parameters: IDataObject = { custom: customParams as IDataObject };
						if (additional.systemParams) {
							const sys = parseJsonParameter.call(
								this,
								additional.systemParams,
								'System Parameters',
								i,
							);
							if (sys !== undefined) parameters.system = sys;
						}

						const body: IDataObject = {
							scraper_slug: slug,
							version,
							input: { parameters },
						};
						if (additional.callbackUrl) body.callback_url = additional.callbackUrl;

						result = await coreClawApiRequest.call(this, 'POST', '/api/v1/scraper/run', body);
					} else {
						throw unknownOperation.call(this, resource, operation, i);
					}
				}

				// ===================== RUN =====================
				else if (resource === 'run') {
					if (operation === 'get') {
						const runSlug = this.getNodeParameter('runSlug', i) as string;
						result = await coreClawApiRequest.call(
							this,
							'POST',
							'/api/v1/run/detail',
							{ run_slug: runSlug },
						);
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const limit = returnAll
							? Number.MAX_SAFE_INTEGER
							: (this.getNodeParameter('limit', i, 50) as number);
						const records = await paginate.call(this, '/api/v1/run/list', {
							status: (filters.status as number) ?? 0,
							scraper_slug: (filters.scraperSlug as string) ?? '',
						}, limit);
						result = records;
						pushAsList = true;
					} else if (operation === 'getResults') {
						const runSlug = this.getNodeParameter('runSlug', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const limit = returnAll
							? Number.MAX_SAFE_INTEGER
							: (this.getNodeParameter('limit', i, 50) as number);
						const records = await paginate.call(
							this,
							'/api/v1/run/result/list',
							{ run_slug: runSlug },
							limit,
						);
						result = records;
						pushAsList = true;
					} else if (operation === 'exportResults') {
						const runSlug = this.getNodeParameter('runSlug', i) as string;
						const format = this.getNodeParameter('format', i, 'csv') as string;
						const filterKeysRaw = this.getNodeParameter('filterKeys', i, '') as string;
						const body: IDataObject = {
							run_slug: runSlug,
							format,
							filter_keys: splitCsv(filterKeysRaw),
						};
						result = await coreClawApiRequest.call(
							this,
							'POST',
							'/api/v1/run/result/export',
							body,
						);
					} else if (operation === 'getLogs') {
						const runSlug = this.getNodeParameter('runSlug', i) as string;
						result = await coreClawApiRequest.call(
							this,
							'POST',
							'/api/v1/run/last/log',
							{ run_slug: runSlug },
						);
					} else if (operation === 'abort') {
						const runSlug = this.getNodeParameter('runSlug', i) as string;
						result = await coreClawApiRequest.call(
							this,
							'POST',
							'/api/v1/scraper/abort',
							{ run_slug: runSlug },
						);
					} else if (operation === 'rerun') {
						const runSlug = this.getNodeParameter('runSlug', i) as string;
						const additional = this.getNodeParameter(
							'additionalFields',
							i,
							{},
						) as IDataObject;
						const body: IDataObject = { run_slug: runSlug };
						if (additional.callbackUrl) body.callback_url = additional.callbackUrl;
						result = await coreClawApiRequest.call(this, 'POST', '/api/v1/rerun', body);
					} else {
						throw unknownOperation.call(this, resource, operation, i);
					}
				}

				// ===================== TASK =====================
				else if (resource === 'task') {
					if (operation === 'run') {
						const taskSlug = this.getNodeParameter('taskSlug', i) as string;
						const additional = this.getNodeParameter(
							'additionalFields',
							i,
							{},
						) as IDataObject;
						const body: IDataObject = { task_slug: taskSlug };
						if (additional.callbackUrl) body.callback_url = additional.callbackUrl;
						result = await coreClawApiRequest.call(this, 'POST', '/api/v1/task/run', body);
					} else {
						throw unknownOperation.call(this, resource, operation, i);
					}
				}

				// ===================== ACCOUNT =====================
				else if (resource === 'account') {
					if (operation === 'getInfo') {
						result = await coreClawApiRequest.call(
							this,
							'POST',
							'/api/v1/account/info',
							{},
						);
					} else {
						throw unknownOperation.call(this, resource, operation, i);
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown resource: ${resource}`,
						{ itemIndex: i },
					);
				}

				// Emit results
				if (pushAsList && Array.isArray(result)) {
					for (const record of result) {
						returnData.push({
							json: (record as IDataObject) ?? {},
							pairedItem: { item: i },
						});
					}
				} else {
					returnData.push({
						json: (result as IDataObject) ?? {},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const e = error as { message?: string; description?: string; cause?: unknown };
					returnData.push({
						json: {
							error: e.message ?? 'Unknown error',
							errorDescription: e.description ?? '',
						},
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

/**
 * Iterate paginated CoreClaw list endpoints, accumulating up to `limit` records.
 * The CoreClaw envelope wraps results as { records: [...], total: N }.
 */
async function paginate(
	this: IExecuteFunctions,
	path: string,
	baseBody: IDataObject,
	limit: number,
): Promise<IDataObject[]> {
	const pageSize = Math.min(100, Math.max(1, limit === Number.MAX_SAFE_INTEGER ? 100 : limit));
	const collected: IDataObject[] = [];
	let pageIndex = 1;

	while (collected.length < limit) {
		const data = (await coreClawApiRequest.call(this, 'POST', path, {
			...baseBody,
			page_index: pageIndex,
			page_size: pageSize,
		})) as IDataObject | null;

		// Guard: any non-object response (null / array) means the API contract changed.
		// Surface it as an explicit error rather than silently returning zero records.
		if (data === null || typeof data !== 'object' || Array.isArray(data)) {
			throw new NodeOperationError(
				this.getNode(),
				`CoreClaw ${path} returned an unexpected shape — expected an object with a 'records' array.`,
			);
		}
		const records = extractPaginatedRecords(data);
		if (records === undefined) {
			throw new NodeOperationError(
				this.getNode(),
				`CoreClaw ${path} response is missing a records array. Keys returned: ${Object.keys(data).join(', ') || '(none)'}.`,
			);
		}

		collected.push(...records);

		if (records.length < pageSize) break;
		pageIndex += 1;
	}

	return collected.slice(0, limit);
}

function unknownOperation(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): NodeOperationError {
	return new NodeOperationError(
		this.getNode(),
		`Unknown operation "${operation}" for resource "${resource}"`,
		{ itemIndex },
	);
}

function normalizeScraperSearchResults(data: unknown): IDataObject[] {
	if (Array.isArray(data)) return data as IDataObject[];
	if (data === null || typeof data !== 'object') return [];

	const response = data as IDataObject;
	for (const key of ['scraper', 'scrapers', 'records']) {
		const value = response[key];
		if (Array.isArray(value)) return value as IDataObject[];
	}

	return [];
}

function extractPaginatedRecords(data: IDataObject): IDataObject[] | undefined {
	for (const key of ['records', 'runs', 'run', 'results', 'items', 'list', 'data']) {
		const value = data[key];
		if (Array.isArray(value)) return value as IDataObject[];
	}

	return undefined;
}
