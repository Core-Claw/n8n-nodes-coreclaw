import type { INodeProperties } from 'n8n-workflow';

const runIdOperations = ['get', 'abort', 'getLog', 'rerun', 'rerunAndGetResults', 'listResults', 'exportResults'];
const listOperations = ['list', 'listLastResults', 'listResults', 'rerunAndGetResults'];
const runBodyOperations = ['abortLast', 'rerunLast', 'rerun'];

const runIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Run ID',
	name: 'runId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: { searchListMethod: 'searchWorkerRuns', searchable: true },
		},
		{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'run_abc123' },
	],
});

const returnAllField = (operations: string[]): INodeProperties => ({
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	description: 'Whether to return all results or only up to a given limit',
});

const offsetField = (operations: string[]): INodeProperties => ({
	displayName: 'Offset',
	name: 'offset',
	type: 'number',
	typeOptions: {
		minValue: 0,
	},
	default: 0,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	description: 'Number of records to skip',
});

const limitField = (operations: string[], onlyWhenReturnAllIsFalse: boolean): INodeProperties => ({
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	typeOptions: {
		minValue: 1,
		maxValue: 100,
	},
	default: 50,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
			...(onlyWhenReturnAllIsFalse ? { returnAll: [false] } : {}),
		},
	},
	description: 'Max number of results to return',
});

const callbackUrlField = (operations: string[]): INodeProperties => ({
	displayName: 'Callback URL',
	name: 'callback_url',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	description: 'Optional URL CoreClaw calls with run status updates',
	placeholder: 'https://your-n8n.example.com/webhook/coreclaw',
});

const isAsyncField = (operations: string[]): INodeProperties => ({
	displayName: 'Run Asynchronously',
	name: 'is_async',
	type: 'boolean',
	default: true,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	description: 'Whether CoreClaw should run asynchronously',
});

const waitForFinishField = (operations: string[]): INodeProperties => ({
	displayName: 'Wait for Finish',
	name: 'waitForFinish',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	description: 'Whether to poll until the worker run finishes',
});

const formatField = (operations: string[]): INodeProperties => ({
	displayName: 'Format',
	name: 'format',
	type: 'options',
	default: 'csv',
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	options: [
		{ name: 'CSV', value: 'csv' },
		{ name: 'JSON', value: 'json' },
	],
	description: 'Export file format',
});

const filterKeysField = (operations: string[]): INodeProperties => ({
	displayName: 'Filter Keys',
	name: 'filter_keys',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
		},
	},
	description: 'Comma-separated result field keys to export. Leave empty to include all fields.',
	placeholder: 'title,price,url',
});

export const workerRunOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['workerRun'],
			},
		},
		options: [
			{
				name: 'Abort',
				value: 'abort',
				description: 'Abort a worker run',
				action: 'Abort worker run',
			},
			{
				name: 'Abort Last',
				value: 'abortLast',
				description: 'Abort the last worker run',
				action: 'Abort last worker run',
			},
			{
				name: 'Export Last Results',
				value: 'exportLastResults',
				description: 'Export results from the last worker run',
				action: 'Export last worker run results',
			},
			{
				name: 'Export Results',
				value: 'exportResults',
				description: 'Export results from a worker run',
				action: 'Export worker run results',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a worker run',
				action: 'Get worker run',
			},
			{
				name: 'Get Last',
				value: 'getLast',
				description: 'Get the last worker run',
				action: 'Get last worker run',
			},
			{
				name: 'Get Last Log',
				value: 'getLastLog',
				description: 'Get logs from the last worker run',
				action: 'Get last worker run log',
			},
			{
				name: 'Get Log',
				value: 'getLog',
				description: 'Get logs from a worker run',
				action: 'Get worker run log',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List CoreClaw API v2 worker runs',
				action: 'List worker runs',
			},
			{
				name: 'List Last Results',
				value: 'listLastResults',
				description: 'List results from the last worker run',
				action: 'List last worker run results',
			},
			{
				name: 'List Results',
				value: 'listResults',
				description: 'List results from a worker run',
				action: 'List worker run results',
			},
			{
				name: 'Rerun',
				value: 'rerun',
				description: 'Rerun a worker run',
				action: 'Rerun worker run',
			},
			{
				name: 'Rerun and Get Results',
				value: 'rerunAndGetResults',
				description: 'Rerun a worker run, wait for it to finish, and return the result rows in one step',
				action: 'Rerun worker run and get results',
			},
			{
				name: 'Rerun Last',
				value: 'rerunLast',
				description: 'Rerun the last worker run',
				action: 'Rerun last worker run',
			}
		],
		default: 'list',
	},
];

export const workerRunFields: INodeProperties[] = [
	runIdField(runIdOperations),
	returnAllField(listOperations),
	offsetField(listOperations),
	limitField(listOperations, true),
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerRun'],
				operation: ['list'],
			},
		},
		options: [
			{ name: 'Aborting', value: 'aborting' },
			{ name: 'All', value: '' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Ready', value: 'ready' },
			{ name: 'Running', value: 'running' },
			{ name: 'Succeeded', value: 'succeeded' },
		],
		description: 'Filter by worker run status',
	},
	{
		displayName: 'Worker ID',
		name: 'worker_id',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerRun'],
				operation: ['list'],
			},
		},
		description: 'Filter by worker slug or owner path',
		placeholder: 'owner~demo-worker',
	},
	callbackUrlField(runBodyOperations),
	isAsyncField(runBodyOperations),
	offsetField(runBodyOperations),
	limitField(runBodyOperations, false),
	waitForFinishField(['rerunLast', 'rerun']),
	formatField(['exportLastResults', 'exportResults']),
	filterKeysField(['exportLastResults', 'exportResults']),
];
