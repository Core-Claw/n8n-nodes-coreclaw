import type { INodeProperties } from 'n8n-workflow';

const runIdOperations = ['get', 'abort', 'getLog', 'rerun', 'listResults', 'exportResults'];
const listOperations = ['list', 'listLastResults', 'listResults'];
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
	description: 'Whether to return all matching records',
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
	default: 20,
	displayOptions: {
		show: {
			resource: ['workerRun'],
			operation: operations,
			...(onlyWhenReturnAllIsFalse ? { returnAll: [false] } : {}),
		},
	},
	description: 'Max number of records to return',
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
	description: 'Comma-separated result field keys to export. Leave empty to include all fields',
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
				name: 'List',
				value: 'list',
				description: 'List CoreClaw API v2 worker runs',
				action: 'List worker runs',
			},
			{
				name: 'Get Last',
				value: 'getLast',
				description: 'Get the last worker run',
				action: 'Get last worker run',
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
				name: 'Get Last Log',
				value: 'getLastLog',
				description: 'Get logs from the last worker run',
				action: 'Get last worker run log',
			},
			{
				name: 'Rerun Last',
				value: 'rerunLast',
				description: 'Rerun the last worker run',
				action: 'Rerun last worker run',
			},
			{
				name: 'List Last Results',
				value: 'listLastResults',
				description: 'List results from the last worker run',
				action: 'List last worker run results',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a worker run',
				action: 'Get worker run',
			},
			{
				name: 'Abort',
				value: 'abort',
				description: 'Abort a worker run',
				action: 'Abort worker run',
			},
			{
				name: 'Get Log',
				value: 'getLog',
				description: 'Get logs from a worker run',
				action: 'Get worker run log',
			},
			{
				name: 'Rerun',
				value: 'rerun',
				description: 'Rerun a worker run',
				action: 'Rerun worker run',
			},
			{
				name: 'List Results',
				value: 'listResults',
				description: 'List results from a worker run',
				action: 'List worker run results',
			},
			{
				name: 'Export Results',
				value: 'exportResults',
				description: 'Export results from a worker run',
				action: 'Export worker run results',
			},
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
			{ name: 'All', value: '' },
			{ name: 'Ready', value: 'ready' },
			{ name: 'Running', value: 'running' },
			{ name: 'Succeeded', value: 'succeeded' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Aborting', value: 'aborting' },
		],
		description: 'Filter by worker run status',
	},
	callbackUrlField(runBodyOperations),
	isAsyncField(runBodyOperations),
	offsetField(runBodyOperations),
	limitField(runBodyOperations, false),
	waitForFinishField(['rerunLast', 'rerun']),
	formatField(['exportLastResults', 'exportResults']),
	filterKeysField(['exportLastResults', 'exportResults']),
];
