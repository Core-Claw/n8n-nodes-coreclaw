import type { INodeProperties } from 'n8n-workflow';

const queueRunOperations = ['queueRun'];
const listOperations = ['list'];
const queueIdOperations = ['releaseOne'];

const workerIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Worker ID',
	name: 'workerId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	displayOptions: {
		show: {
			resource: ['runQueue'],
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

const queueIdField = (operations: string[]): INodeProperties => ({
	displayName: 'Queue ID',
	name: 'queueId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['runQueue'],
			operation: operations,
		},
	},
	description: 'Queue item ID (queue_ref). Obtain from List Items.',
	placeholder: '22',
});

const returnAllField = (operations: string[]): INodeProperties => ({
	displayName: 'Return All',
	name: 'returnAll',
	type: 'boolean',
	default: false,
	displayOptions: {
		show: {
			resource: ['runQueue'],
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
	default: 1,
	displayOptions: {
		show: {
			resource: ['runQueue'],
			operation: operations,
		},
	},
	description: 'Page number, 1-based. offset=1 is page 1; offset=0 is accepted as page 1.',
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
			resource: ['runQueue'],
			operation: operations,
			...(onlyWhenReturnAllIsFalse ? { returnAll: [false] } : {}),
		},
	},
	description: 'Max number of results to return',
});

const queueRefsField = (operations: string[]): INodeProperties => ({
	displayName: 'Queue Refs',
	name: 'queue_refs',
	type: 'json',
	default: '',
	required: true,
	displayOptions: {
		show: {
			resource: ['runQueue'],
			operation: operations,
		},
	},
	description: 'JSON array of queue item IDs to activate or release, e.g. ["22","23"]. Obtain queue_ref values from List Items.',
	typeOptions: {
		rows: 4,
	},
	placeholder: '["22","23"]',
});

const reasonField = (operations: string[]): INodeProperties => ({
	displayName: 'Reason',
	name: 'reason',
	type: 'string',
	default: '',
	displayOptions: {
		show: {
			resource: ['runQueue'],
			operation: operations,
		},
	},
	description: 'Optional reason for releasing queue items, recorded for later reference',
});

export const runQueueOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['runQueue'],
			},
		},
		options: [
			{
				name: 'Activate Items',
				value: 'activate',
				description: 'Activate one or more queued run items so they start executing',
				action: 'Activate run queue items',
			},
			{
				name: 'List Items',
				value: 'list',
				description: 'List run queue items, optionally filtered by status',
				action: 'List run queue items',
			},
			{
				name: 'Queue Run',
				value: 'queueRun',
				description: 'Queue a worker run for later activation',
				action: 'Queue a worker run',
			},
			{
				name: 'Release Items',
				value: 'release',
				description: 'Release (discard) one or more queued run items in bulk',
				action: 'Release run queue items',
			},
			{
				name: 'Release One Item',
				value: 'releaseOne',
				description: 'Release (discard) a single queued run item',
				action: 'Release one run queue item',
			},
		],
		default: 'list',
	},
];

export const runQueueFields: INodeProperties[] = [
	workerIdField(queueRunOperations),
	queueIdField(queueIdOperations),
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
				resource: ['runQueue'],
				operation: ['list'],
			},
		},
		options: [
			{ name: 'All', value: '' },
			{ name: 'Waiting', value: 'waiting' },
			{ name: 'Inactive', value: 'inactive' },
		],
		description: 'Filter by queue item status',
	},
	queueRefsField(['activate', 'release']),
	reasonField(['release', 'releaseOne']),
	{
		displayName: 'Version',
		name: 'version',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['runQueue'],
				operation: ['queueRun'],
			},
		},
		description: 'Worker script version. Leave empty to use the CoreClaw default.',
		placeholder: 'v1.2.3',
	},
	{
		displayName: 'Input JSON',
		name: 'input_json',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				resource: ['runQueue'],
				operation: ['queueRun'],
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
				resource: ['runQueue'],
				operation: ['queueRun'],
			},
		},
		description: 'Full CoreClaw input object. Do not use together with Input JSON.',
		typeOptions: {
			rows: 6,
		},
	},
	{
		displayName: 'Callback URL',
		name: 'callback_url',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['runQueue'],
				operation: ['queueRun'],
			},
		},
		description: 'Optional URL CoreClaw calls with run status updates',
		placeholder: 'https://your-n8n.example.com/webhook/coreclaw',
	},
	{
		displayName: 'Run Asynchronously',
		name: 'is_async',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['runQueue'],
				operation: ['queueRun'],
			},
		},
		description: 'Whether CoreClaw should run asynchronously',
	},
];
