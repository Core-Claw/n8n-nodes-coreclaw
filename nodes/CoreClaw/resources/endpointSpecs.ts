/* eslint-disable n8n-nodes-base/node-param-display-name-not-first-position */
/* eslint-disable n8n-nodes-base/node-param-type-options-missing-from-limit */

import type { CoreClawEndpointSpec, CoreClawParamSpec } from '../types';

const offsetParam = (): CoreClawParamSpec => ({
	name: 'offset',
	displayName: 'Offset',
	location: 'query',
	type: 'number',
	default: 0,
	description: 'Result offset. Must be 0 or greater.',
});

const limitParam = (): CoreClawParamSpec => ({
	name: 'limit',
	displayName: 'Limit',
	location: 'query',
	type: 'number',
	default: 50,
	description: 'Max number of results to return',
});

const bodyOffsetParam = (): CoreClawParamSpec => ({ ...offsetParam(), location: 'body' });

const bodyLimitParam = (): CoreClawParamSpec => ({ ...limitParam(), location: 'body' });

const keywordParam = (description: string): CoreClawParamSpec => ({
	name: 'keyword',
	displayName: 'Keyword',
	location: 'query',
	type: 'string',
	default: '',
	description,
});

const workerIdPathParam = (): CoreClawParamSpec => ({
	name: 'workerId',
	displayName: 'Worker ID',
	location: 'path',
	type: 'string',
	default: '',
	required: true,
	description: 'Worker slug or owner path, such as demo-worker or owner~demo-worker',
});

const runIdPathParam = (): CoreClawParamSpec => ({
	name: 'runId',
	displayName: 'Run ID',
	location: 'path',
	type: 'string',
	default: '',
	required: true,
	description: 'Worker run identifier returned by run or list operations',
});

const workerTaskIdPathParam = (): CoreClawParamSpec => ({
	name: 'workerTaskId',
	displayName: 'Worker Task ID',
	location: 'path',
	type: 'string',
	default: '',
	required: true,
	description: 'Saved worker task identifier returned by the list worker tasks operation',
});

const isAsyncParam = (): CoreClawParamSpec => ({
	name: 'is_async',
	displayName: 'Run Asynchronously',
	location: 'body',
	type: 'boolean',
	default: true,
	description: 'Whether CoreClaw should run asynchronously',
});

const callbackUrlParam = (): CoreClawParamSpec => ({
	name: 'callback_url',
	displayName: 'Callback URL',
	location: 'body',
	type: 'string',
	default: '',
	description: 'Optional URL CoreClaw calls with run status updates',
});

const formatParam = (): CoreClawParamSpec => ({
	name: 'format',
	displayName: 'Format',
	location: 'query',
	type: 'string',
	default: 'csv',
	options: [
		{ name: 'CSV', value: 'csv' },
		{ name: 'JSON', value: 'json' },
		{ name: 'JSONL', value: 'jsonl' },
		{ name: 'XLSX', value: 'xlsx' },
		{ name: 'XLS', value: 'xls' },
		{ name: 'XML', value: 'xml' },
		{ name: 'HTML', value: 'html' },
		{ name: 'RSS', value: 'rss' },
	],
	description: 'Export file format. Supports csv, json, jsonl, xlsx, xls, xml, html, rss (case-insensitive). Defaults to csv.',
});

const filterKeysParam = (): CoreClawParamSpec => ({
	name: 'filter_keys',
	displayName: 'Filter Keys',
	location: 'query',
	type: 'string',
	default: '',
	description: 'Comma-separated field keys to export. Leave empty to include all fields.',
});

const runBodyParams = (): CoreClawParamSpec[] => [
	callbackUrlParam(),
	isAsyncParam(),
	bodyOffsetParam(),
	bodyLimitParam(),
];

// --- worker-task schedule body params (create/update) ---

const taskTitleParam = (): CoreClawParamSpec => ({
	name: 'title',
	displayName: 'Title',
	location: 'body',
	type: 'string',
	default: '',
	required: true,
	description: 'Task title',
});

const taskDescriptionParam = (): CoreClawParamSpec => ({
	name: 'description',
	displayName: 'Description',
	location: 'body',
	type: 'string',
	default: '',
	description: 'Task description',
});

const taskVersionParam = (): CoreClawParamSpec => ({
	name: 'version',
	displayName: 'Version',
	location: 'body',
	type: 'string',
	default: '',
	description: 'Worker script version. Leave empty to use the current worker version.',
});

const taskWorkerIdBodyParam = (): CoreClawParamSpec => ({
	name: 'worker_id',
	displayName: 'Worker ID',
	location: 'body',
	type: 'string',
	default: '',
	required: true,
	description: 'Worker slug or owner path, such as demo-worker or owner~demo-worker',
});

const taskInputJsonBodyParam = (): CoreClawParamSpec => ({
	name: 'input_json',
	displayName: 'Input JSON',
	location: 'body',
	type: 'json',
	default: '',
	required: true,
	description: 'Task input JSON. Wrapped as input.parameters.custom.',
});

const scheduleTypeParam = (): CoreClawParamSpec => ({
	name: 'schedule_type',
	displayName: 'Schedule Type',
	location: 'body',
	type: 'number',
	default: '',
	options: [
		{ name: 'Daily', value: 1 },
		{ name: 'Weekly', value: 2 },
		{ name: 'Monthly', value: 3 },
		{ name: 'Once', value: 4 },
	],
	description: 'Schedule type: 1=daily, 2=weekly, 3=monthly, 4=once',
});

const scheduleTimeParam = (): CoreClawParamSpec => ({
	name: 'schedule_time',
	displayName: 'Schedule Time',
	location: 'body',
	type: 'string',
	default: '',
	description: 'Schedule time of day in HH:mm format, for example 09:00',
});

const scheduleWeekdayParam = (): CoreClawParamSpec => ({
	name: 'schedule_weekday',
	displayName: 'Schedule Weekday',
	location: 'body',
	type: 'number',
	default: '',
	options: [
		{ name: 'Monday', value: 1 },
		{ name: 'Tuesday', value: 2 },
		{ name: 'Wednesday', value: 3 },
		{ name: 'Thursday', value: 4 },
		{ name: 'Friday', value: 5 },
		{ name: 'Saturday', value: 6 },
		{ name: 'Sunday', value: 7 },
	],
	description: 'Day of week for weekly schedules: 1=Monday … 7=Sunday',
});

const scheduleDayParam = (): CoreClawParamSpec => ({
	name: 'schedule_day',
	displayName: 'Schedule Day',
	location: 'body',
	type: 'number',
	default: '',
	description: 'Day of month for monthly schedules (1-31)',
});

const scheduleOnceDateParam = (): CoreClawParamSpec => ({
	name: 'schedule_once_date',
	displayName: 'Schedule Once Date',
	location: 'body',
	type: 'string',
	default: '',
	description: 'Date for one-time schedules in YYYY-MM-DD format',
});

const scheduleEnabledParam = (): CoreClawParamSpec => ({
	name: 'schedule_enabled',
	displayName: 'Schedule Enabled',
	location: 'body',
	type: 'number',
	default: '',
	options: [
		{ name: 'Disabled', value: 0 },
		{ name: 'Enabled', value: 1 },
	],
	description: 'Schedule switch: 0=disabled, 1=enabled',
});

const taskScheduleParams = (): CoreClawParamSpec[] => [
	scheduleTypeParam(),
	scheduleTimeParam(),
	scheduleWeekdayParam(),
	scheduleDayParam(),
	scheduleOnceDateParam(),
	scheduleEnabledParam(),
];

export const excludedEndpointKeys = [
	'POST /api/v2/workers/{workerId}/versions',
	'PUT /api/v2/workers/{workerId}/versions/{version}',
	'GET /api/v2/workers/{workerId}/internal',
] as const;

export const endpointSpecs: CoreClawEndpointSpec[] = [
	{
		resource: 'proxy',
		operation: 'listRegions',
		displayName: 'List Regions',
		action: 'List proxy regions',
		method: 'GET',
		path: '/api/v2/proxy/region',
		auth: false,
		returnsList: true,
		params: [
			{
				name: 'language',
				displayName: 'Language',
				location: 'query',
				type: 'string',
				default: 'en',
				options: [
					{ name: 'English', value: 'en' },
					{ name: 'Chinese', value: 'zh' },
				],
				description: 'Region display language',
			},
		],
	},
	{
		resource: 'storeWorker',
		operation: 'list',
		displayName: 'List',
		action: 'List store workers',
		method: 'GET',
		path: '/api/v2/store',
		auth: false,
		returnsList: true,
		supportsReturnAll: true,
		params: [offsetParam(), limitParam(), keywordParam('Keyword for title, slug, or path.')],
	},
	{
		resource: 'account',
		operation: 'getInfo',
		displayName: 'Get Info',
		action: 'Get account info',
		method: 'GET',
		path: '/api/v2/users/account',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'list',
		displayName: 'List',
		action: 'List worker runs',
		method: 'GET',
		path: '/api/v2/worker-runs',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [
			offsetParam(),
			limitParam(),
			{
				name: 'worker_id',
				displayName: 'Worker ID',
				location: 'query',
				type: 'string',
				default: '',
				description: 'Filter by worker slug or owner path',
			},
			{
				name: 'status',
				displayName: 'Status',
				location: 'query',
				type: 'string',
				default: '',
				options: [
					{ name: 'Ready', value: 'ready' },
					{ name: 'Running', value: 'running' },
					{ name: 'Succeeded', value: 'succeeded' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Aborting', value: 'aborting' },
				],
				description: 'Filter by run status',
			},
		],
	},
	{
		resource: 'workerRun',
		operation: 'getLast',
		displayName: 'Get Last',
		action: 'Get last worker run',
		method: 'GET',
		path: '/api/v2/worker-runs/last',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'abortLast',
		displayName: 'Abort Last',
		action: 'Abort last worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/last/abort',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'exportLastResults',
		displayName: 'Export Last Results',
		action: 'Export last worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/last/export',
		auth: true,
		params: [formatParam(), filterKeysParam()],
	},
	{
		resource: 'workerRun',
		operation: 'getLastLog',
		displayName: 'Get Last Log',
		action: 'Get last worker run log',
		method: 'GET',
		path: '/api/v2/worker-runs/last/log',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'rerunLast',
		displayName: 'Rerun Last',
		action: 'Rerun last worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/last/rerun',
		auth: true,
		supportsWaitForFinish: true,
		params: runBodyParams(),
	},
	{
		resource: 'workerRun',
		operation: 'listLastResults',
		displayName: 'List Last Results',
		action: 'List last worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/last/result',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [offsetParam(), limitParam()],
	},
	{
		resource: 'workerRun',
		operation: 'get',
		displayName: 'Get',
		action: 'Get worker run',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}',
		auth: true,
		params: [runIdPathParam()],
	},
	{
		resource: 'workerRun',
		operation: 'abort',
		displayName: 'Abort',
		action: 'Abort worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/{runId}/abort',
		auth: true,
		params: [runIdPathParam()],
	},
	{
		resource: 'workerRun',
		operation: 'getLog',
		displayName: 'Get Log',
		action: 'Get worker run log',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}/log',
		auth: true,
		params: [runIdPathParam()],
	},
	{
		resource: 'workerRun',
		operation: 'rerun',
		displayName: 'Rerun',
		action: 'Rerun worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/{runId}/rerun',
		auth: true,
		supportsWaitForFinish: true,
		params: [runIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'workerRun',
		operation: 'listResults',
		displayName: 'List Results',
		action: 'List worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}/result',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [runIdPathParam(), offsetParam(), limitParam()],
	},
	{
		resource: 'workerRun',
		operation: 'exportResults',
		displayName: 'Export Results',
		action: 'Export worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}/result/export',
		auth: true,
		params: [runIdPathParam(), formatParam(), filterKeysParam()],
	},
	{
		resource: 'workerTask',
		operation: 'list',
		displayName: 'List',
		action: 'List worker tasks',
		method: 'GET',
		path: '/api/v2/worker-tasks',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [
			offsetParam(),
			limitParam(),
			{
				name: 'worker_id',
				displayName: 'Worker ID',
				location: 'query',
				type: 'string',
				default: '',
				description: 'Filter by worker slug or owner path',
			},
			keywordParam('Keyword for task title or slug.'),
		],
	},
	{
		resource: 'workerTask',
		operation: 'run',
		displayName: 'Run',
		action: 'Run worker task',
		method: 'POST',
		path: '/api/v2/worker-tasks/{workerTaskId}/runs',
		auth: true,
		supportsWaitForFinish: true,
		params: [workerTaskIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'workerTask',
		operation: 'create',
		displayName: 'Create',
		action: 'Create worker task',
		method: 'POST',
		path: '/api/v2/worker-tasks',
		auth: true,
		wrapsInput: true,
		params: [
			taskWorkerIdBodyParam(),
			taskTitleParam(),
			taskInputJsonBodyParam(),
			taskDescriptionParam(),
			taskVersionParam(),
			...taskScheduleParams(),
		],
	},
	{
		resource: 'workerTask',
		operation: 'get',
		displayName: 'Get',
		action: 'Get worker task',
		method: 'GET',
		path: '/api/v2/worker-tasks/{workerTaskId}',
		auth: true,
		params: [workerTaskIdPathParam()],
	},
	{
		resource: 'workerTask',
		operation: 'update',
		displayName: 'Update',
		action: 'Update worker task',
		method: 'PUT',
		path: '/api/v2/worker-tasks/{workerTaskId}',
		auth: true,
		params: [workerTaskIdPathParam(), taskTitleParam(), taskDescriptionParam(), ...taskScheduleParams()],
	},
	{
		resource: 'workerTask',
		operation: 'delete',
		displayName: 'Delete',
		action: 'Delete worker task',
		method: 'DELETE',
		path: '/api/v2/worker-tasks/{workerTaskId}',
		auth: true,
		params: [workerTaskIdPathParam()],
	},
	{
		resource: 'workerTask',
		operation: 'getInput',
		displayName: 'Get Input',
		action: 'Get worker task input',
		method: 'GET',
		path: '/api/v2/worker-tasks/{workerTaskId}/input',
		auth: true,
		params: [workerTaskIdPathParam()],
	},
	{
		resource: 'workerTask',
		operation: 'updateInput',
		displayName: 'Update Input',
		action: 'Update worker task input',
		method: 'PUT',
		path: '/api/v2/worker-tasks/{workerTaskId}/input',
		auth: true,
		wrapsInput: true,
		params: [workerTaskIdPathParam(), taskInputJsonBodyParam(), taskVersionParam()],
	},
	{
		resource: 'worker',
		operation: 'list',
		displayName: 'List',
		action: 'List workers',
		method: 'GET',
		path: '/api/v2/workers',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [offsetParam(), limitParam(), keywordParam('Keyword for title, slug, or path.')],
	},
	{
		resource: 'worker',
		operation: 'get',
		displayName: 'Get',
		action: 'Get worker',
		method: 'GET',
		path: '/api/v2/workers/{workerId}',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'getInputSchema',
		displayName: 'Get Input Schema',
		action: 'Get worker input schema',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/input-schema',
		auth: false,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'run',
		displayName: 'Run',
		action: 'Run worker',
		method: 'POST',
		path: '/api/v2/workers/{workerId}/runs',
		auth: true,
		supportsWaitForFinish: true,
		wrapsInput: true,
		params: [
			workerIdPathParam(),
			{
				name: 'version',
				displayName: 'Version',
				location: 'body',
				type: 'string',
				default: '',
				description: 'Worker script version. Leave empty to use backend default.',
			},
			{
				name: 'input_json',
				displayName: 'Input JSON',
				location: 'body',
				type: 'json',
				default: '',
				description: 'Worker business input JSON. Wrapped as input.parameters.custom.',
			},
			{
				name: 'raw_input_json',
				displayName: 'Raw Input JSON',
				location: 'body',
				type: 'json',
				default: '',
				description: 'Advanced full CoreClaw input object. Do not combine with Input JSON.',
			},
			...runBodyParams(),
		],
	},
	{
		resource: 'worker',
		operation: 'getLastRun',
		displayName: 'Get Last Run',
		action: 'Get worker last run',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'abortLastRun',
		displayName: 'Abort Last Run',
		action: 'Abort worker last run',
		method: 'POST',
		path: '/api/v2/workers/{workerId}/runs/last/abort',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'exportLastRunResults',
		displayName: 'Export Last Run Results',
		action: 'Export worker last run results',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last/export',
		auth: true,
		params: [workerIdPathParam(), formatParam(), filterKeysParam()],
	},
	{
		resource: 'worker',
		operation: 'getLastRunLog',
		displayName: 'Get Last Run Log',
		action: 'Get worker last run log',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last/log',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'rerunLastRun',
		displayName: 'Rerun Last Run',
		action: 'Rerun worker last run',
		method: 'POST',
		path: '/api/v2/workers/{workerId}/runs/last/rerun',
		auth: true,
		supportsWaitForFinish: true,
		params: [workerIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'worker',
		operation: 'listLastRunResults',
		displayName: 'List Last Run Results',
		action: 'List worker last run results',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last/result',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [workerIdPathParam(), offsetParam(), limitParam()],
	},
];

/**
 * Composite operations chain run → poll → fetch results into one node. They
 * reuse the trigger endpoint (worker.run / workerTask.run / workerRun.rerun)
 * as their starting call, so we attach the existing spec as compositeTrigger.
 *
 * Params here only describe the UI fields the composite operation reads:
 *   - the trigger's own params (workerId/input/version, workerTaskId, runId)
 *   - result pagination (offset/limit/returnAll)
 *
 * The composite executor forces is_async=true and ignores waitForFinish since
 * it always polls client-side.
 */
function buildRunAndGetResultsSpecs(): CoreClawEndpointSpec[] {
	const workerRunTrigger = endpointSpecs.find(
		(spec) => spec.resource === 'worker' && spec.operation === 'run',
	)!;
	const workerTaskRunTrigger = endpointSpecs.find(
		(spec) => spec.resource === 'workerTask' && spec.operation === 'run',
	)!;
	const workerRunRerunTrigger = endpointSpecs.find(
		(spec) => spec.resource === 'workerRun' && spec.operation === 'rerun',
	)!;

	const resultPaginationParams: CoreClawParamSpec[] = [
		offsetParam(),
		limitParam(),
	];

	return [
		{
			resource: 'worker',
			operation: 'runAndGetResults',
			displayName: 'Run and Get Results',
			action: 'Run worker and return result rows',
			method: workerRunTrigger.method,
			path: workerRunTrigger.path,
			auth: true,
			composite: 'runAndGetResults',
			compositeTrigger: workerRunTrigger,
			returnsList: true,
			supportsReturnAll: true,
			params: [...workerRunTrigger.params, ...resultPaginationParams],
		},
		{
			resource: 'workerTask',
			operation: 'runAndGetResults',
			displayName: 'Run and Get Results',
			action: 'Run worker task and return result rows',
			method: workerTaskRunTrigger.method,
			path: workerTaskRunTrigger.path,
			auth: true,
			composite: 'runAndGetResults',
			compositeTrigger: workerTaskRunTrigger,
			returnsList: true,
			supportsReturnAll: true,
			params: [...workerTaskRunTrigger.params, ...resultPaginationParams],
		},
		{
			resource: 'workerRun',
			operation: 'rerunAndGetResults',
			displayName: 'Rerun and Get Results',
			action: 'Rerun worker run and return result rows',
			method: workerRunRerunTrigger.method,
			path: workerRunRerunTrigger.path,
			auth: true,
			composite: 'runAndGetResults',
			compositeTrigger: workerRunRerunTrigger,
			returnsList: true,
			supportsReturnAll: true,
			params: [...workerRunRerunTrigger.params, ...resultPaginationParams],
		},
	];
}

endpointSpecs.push(...buildRunAndGetResultsSpecs());

export function getEndpointSpec(resource: string, operation: string) {
	return endpointSpecs.find((spec) => spec.resource === resource && spec.operation === operation);
}
