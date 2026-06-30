import type { INodeProperties } from 'n8n-workflow';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get CoreClaw API v2 account balance, traffic usage, and plan data',
				action: 'Get account info',
			},
		],
		default: 'getInfo',
	},
];

export const accountFields: INodeProperties[] = [];
