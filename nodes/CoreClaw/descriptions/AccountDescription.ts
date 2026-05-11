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
				description: 'Get account info — balance, traffic usage, plan expiry',
				action: 'Get account info',
			},
		],
		default: 'getInfo',
	},
];

export const accountFields: INodeProperties[] = [];
