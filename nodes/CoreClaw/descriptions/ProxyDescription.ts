import type { INodeProperties } from 'n8n-workflow';

export const proxyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['proxy'],
			},
		},
		options: [
			{
				name: 'List Regions',
				value: 'listRegions',
				description: 'List CoreClaw API v2 proxy regions',
				action: 'List proxy regions',
			},
		],
		default: 'listRegions',
	},
];

export const proxyFields: INodeProperties[] = [
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: 'en',
		displayOptions: {
			show: {
				resource: ['proxy'],
				operation: ['listRegions'],
			},
		},
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'Chinese', value: 'zh' },
		],
		description: 'Language for proxy region names',
	},
];
