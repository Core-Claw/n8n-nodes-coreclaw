import type { INodeProperties } from 'n8n-workflow';

export const storeWorkerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['storeWorker'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				description: 'List public CoreClaw API v2 store workers',
				action: 'List store workers',
			},
		],
		default: 'list',
	},
];

export const storeWorkerFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['storeWorker'],
				operation: ['list'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		default: 0,
		displayOptions: {
			show: {
				resource: ['storeWorker'],
				operation: ['list'],
			},
		},
		description: 'Number of store workers to skip',
	},
	{
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
				resource: ['storeWorker'],
				operation: ['list'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['storeWorker'],
				operation: ['list'],
			},
		},
		description: 'Keyword for worker title, slug, or path',
	},
];
