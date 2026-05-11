import type { INodeProperties } from 'n8n-workflow';

export const taskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['task'],
			},
		},
		options: [
			{
				name: 'Run',
				value: 'run',
				description:
					'Run a pre-configured saved task from the CoreClaw console — parameters are stored with the task',
				action: 'Run a task',
			},
		],
		default: 'run',
	},
];

export const taskFields: INodeProperties[] = [
	{
		displayName: 'Task Slug',
		name: 'taskSlug',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['task'], operation: ['run'] },
		},
		description:
			'Saved task identifier. Found in the CoreClaw console → Tasks page (different from scraper_slug).',
		placeholder: 'task_daily_amazon',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['task'], operation: ['run'] },
		},
		options: [
			{
				displayName: 'Callback URL',
				name: 'callbackUrl',
				type: 'string',
				default: '',
				description:
					'Optional URL CoreClaw POSTs to when the run finishes. Use an n8n Webhook node to receive it.',
				placeholder: 'https://your-n8n.example.com/webhook/coreclaw',
			},
		],
	},
];
