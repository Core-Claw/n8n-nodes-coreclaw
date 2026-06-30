import type { INodeProperties } from 'n8n-workflow';

const workerIdOperations = [
	'get',
	'getInputSchema',
	'run',
	'getLastRun',
	'abortLastRun',
	'exportLastRunResults',
	'getLastRunLog',
	'rerunLastRun',
	'listLastRunResults',
];

const listOperations = ['list'];
const resultListOperations = ['listLastRunResults'];
const runBodyOperations = ['run', 'abortLastRun', 'rerunLastRun'];

const workerIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Worker ID',
	name: 'workerId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	displayOptions: {
		show: {
			resource: ['worker'],
			operation: operations,
		},
	},
	modes: [
		{
			displayName: 'From Store',
			name: 'list',
			type: 'list',
			typeOptions: { searchListMethod: 'searchStoreWorkers', searchable: true },
		},
		{
			displayName: 'From My Workers',
			name: 'owned',
			type: 'list',
			typeOptions: { searchListMethod: 'searchWorkers', searchable: true },
		},
		{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'owner~demo-worker' },
	],
});

const returnAllField = (operations: string[]): INodeProperties => ({
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['worker'],
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
			resource: ['worker'],
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
			resource: ['worker'],
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
			resource: ['worker'],
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
			resource: ['worker'],
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
			resource: ['worker'],
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
			resource: ['worker'],
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
			resource: ['worker'],
			operation: operations,
		},
	},
	description: 'Comma-separated result field keys to export. Leave empty to include all fields.',
	placeholder: 'title,price,url',
});

export const workerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['worker'],
			},
		},
		options: [
			{
				name: 'Abort Last Run',
				value: 'abortLastRun',
				description: 'Abort the last run for a worker',
				action: 'Abort worker last run',
			},
			{
				name: 'Export Last Run Results',
				value: 'exportLastRunResults',
				description: 'Export results from the last run for a worker',
				action: 'Export worker last run results',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a CoreClaw API v2 worker',
				action: 'Get worker',
			},
			{
				name: 'Get Input Schema',
				value: 'getInputSchema',
				description: 'Get the input schema for a worker',
				action: 'Get worker input schema',
			},
			{
				name: 'Get Last Run',
				value: 'getLastRun',
				description: 'Get the last run for a worker',
				action: 'Get worker last run',
			},
			{
				name: 'Get Last Run Log',
				value: 'getLastRunLog',
				description: 'Get logs from the last run for a worker',
				action: 'Get worker last run log',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List CoreClaw API v2 workers owned by the account',
				action: 'List workers',
			},
			{
				name: 'List Last Run Results',
				value: 'listLastRunResults',
				description: 'List results from the last run for a worker',
				action: 'List worker last run results',
			},
			{
				name: 'Rerun Last Run',
				value: 'rerunLastRun',
				description: 'Rerun the last run for a worker',
				action: 'Rerun worker last run',
			},
			{
				name: 'Run',
				value: 'run',
				description: 'Run a CoreClaw API v2 worker',
				action: 'Run worker',
			}
		],
		default: 'list',
	},
];

export const workerFields: INodeProperties[] = [
	workerIdField(workerIdOperations),
	returnAllField(listOperations),
	offsetField(listOperations),
	limitField(listOperations, true),
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['worker'],
				operation: ['list'],
			},
		},
		description: 'Keyword for worker title, slug, or path',
	},
	{
		displayName: 'Version',
		name: 'version',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['worker'],
				operation: ['run'],
			},
		},
		description: 'Worker script version. Leave empty to use the CoreClaw default.',
		placeholder: 'v1.2.3',
	},
	{
		displayName: 'Input JSON',
		name: 'input_json',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['worker'],
				operation: ['run'],
			},
		},
		description: 'Worker input parameters. CoreClaw wraps this as input.parameters.custom.',
		typeOptions: {
			rows: 6,
		},
	},
	{
		displayName: 'Raw Input JSON',
		name: 'raw_input_json',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['worker'],
				operation: ['run'],
			},
		},
		description: 'Full CoreClaw input object. Do not use together with Input JSON.',
		typeOptions: {
			rows: 6,
		},
	},
	callbackUrlField(runBodyOperations),
	isAsyncField(runBodyOperations),
	offsetField(runBodyOperations),
	limitField(runBodyOperations, false),
	waitForFinishField(['run', 'rerunLastRun']),
	formatField(['exportLastRunResults']),
	filterKeysField(['exportLastRunResults']),
	returnAllField(resultListOperations),
	offsetField(resultListOperations),
	limitField(resultListOperations, true),
];
