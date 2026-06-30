import type { INodeProperties } from 'n8n-workflow';

export const triggerProperties: INodeProperties[] = [
	{
		displayName: 'Event Filter',
		name: 'eventFilter',
		type: 'options',
		options: [
			{ name: 'Aborted', value: 'aborted' },
			{ name: 'Any', value: 'any' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Running', value: 'running' },
			{ name: 'Succeeded', value: 'succeeded' },
		],
		default: 'any',
		description: 'Run status callback events that should trigger this workflow',
	},
	{
		displayName: 'Validate Payload',
		name: 'validatePayload',
		type: 'boolean',
		default: true,
		description: 'Whether to require run_id and run_status in callback payloads',
	},
	{
		displayName: 'Include Headers',
		name: 'includeHeaders',
		type: 'boolean',
		default: false,
		description: 'Whether to include request headers in output under _headers',
	},
];
