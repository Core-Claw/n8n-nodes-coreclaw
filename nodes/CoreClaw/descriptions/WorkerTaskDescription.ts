import type { INodeProperties } from 'n8n-workflow';

const listOperations = ['list'];
const runOperations = ['run'];

const workerTaskIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Worker Task ID',
	name: 'workerTaskId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	displayOptions: {
		show: {
			resource: ['workerTask'],
			operation: operations,
		},
	},
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: { searchListMethod: 'searchWorkerTasks', searchable: true },
		},
		{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'task_abc123' },
	],
});

const returnAllField = (operations: string[]): INodeProperties => ({
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['workerTask'],
			operation: operations,
		},
	},
	description: 'Whether to return all matching worker tasks',
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
			resource: ['workerTask'],
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
			resource: ['workerTask'],
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
			resource: ['workerTask'],
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
			resource: ['workerTask'],
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
			resource: ['workerTask'],
			operation: operations,
		},
	},
	description: 'Whether to poll until the worker task run finishes',
});

export const workerTaskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['workerTask'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				description: 'List CoreClaw API v2 worker tasks',
				action: 'List worker tasks',
			},
			{
				name: 'Run',
				value: 'run',
				description: 'Run a saved CoreClaw API v2 worker task',
				action: 'Run worker task',
			},
		],
		default: 'list',
	},
];

export const workerTaskFields: INodeProperties[] = [
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
				resource: ['workerTask'],
				operation: ['list'],
			},
		},
		description: 'Keyword for worker task title or slug',
	},
	{
		displayName: 'Worker ID',
		name: 'worker_id',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: ['list'],
			},
		},
		description: 'Filter by worker slug or owner path',
		placeholder: 'owner~demo-worker',
	},
	workerTaskIdField(runOperations),
	callbackUrlField(runOperations),
	isAsyncField(runOperations),
	offsetField(runOperations),
	limitField(runOperations, false),
	waitForFinishField(runOperations),
];
