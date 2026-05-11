import type { INodeProperties } from 'n8n-workflow';

export const runOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['run'],
			},
		},
		options: [
			{
				name: 'Abort',
				value: 'abort',
				description: 'Abort an in-progress scraper run',
				action: 'Abort a run',
			},
			{
				name: 'Export Results',
				value: 'exportResults',
				description: "Export a run's full result set as a downloadable CSV or JSON file",
				action: 'Export run results',
			},
			{
				name: 'Get',
				value: 'get',
				description:
					'Get the current execution status of a run (status / started_at / duration / cost)',
				action: 'Get a run',
			},
			{
				name: 'Get Logs',
				value: 'getLogs',
				description: 'Fetch execution logs from a run for debugging or understanding failures',
				action: 'Get run logs',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: "List the user's historical scraper runs with pagination and filters",
				action: 'Get many runs',
			},
			{
				name: 'Get Results',
				value: 'getResults',
				description: 'Get paginated result records from a completed run',
				action: 'Get run results',
			},
			{
				name: 'Rerun',
				value: 'rerun',
				description: 'Re-run a previous run with the exact same parameters',
				action: 'Rerun a run',
			},
		],
		default: 'get',
	},
];

const runSlugField: INodeProperties = {
	displayName: 'Run Slug',
	name: 'runSlug',
	type: 'string',
	default: '',
	required: true,
	description: 'Run identifier (returned by Run Scraper / Run Task / Get Many Runs)',
	placeholder: 'run_abc123',
};

export const runFields: INodeProperties[] = [
	// ---------------- Get / Status ----------------
	{
		...runSlugField,
		displayOptions: {
			show: { resource: ['run'], operation: ['get'] },
		},
	},

	// ---------------- Get Many / List ----------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['run'], operation: ['getAll'] },
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 200 },
		default: 50,
		displayOptions: {
			show: { resource: ['run'], operation: ['getAll'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: { resource: ['run'], operation: ['getAll'] },
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 0,
				description: 'Filter by run status',
				options: [
					{ name: 'All', value: 0 },
					{ name: 'Ready', value: 1 },
					{ name: 'Running', value: 2 },
					{ name: 'Succeeded', value: 3 },
					{ name: 'Failed', value: 4 },
					{ name: 'Aborting', value: 5 },
				],
			},
			{
				displayName: 'Scraper Slug',
				name: 'scraperSlug',
				type: 'string',
				default: '',
				description: 'Filter to runs of a specific scraper',
				placeholder: 'amazon-product-scraper',
			},
		],
	},

	// ---------------- Get Results ----------------
	{
		...runSlugField,
		displayOptions: {
			show: { resource: ['run'], operation: ['getResults'] },
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: { resource: ['run'], operation: ['getResults'] },
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 500 },
		default: 50,
		displayOptions: {
			show: { resource: ['run'], operation: ['getResults'], returnAll: [false] },
		},
		description: 'Max number of results to return',
	},

	// ---------------- Export Results ----------------
	{
		...runSlugField,
		displayOptions: {
			show: { resource: ['run'], operation: ['exportResults'] },
		},
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		default: 'csv',
		displayOptions: {
			show: { resource: ['run'], operation: ['exportResults'] },
		},
		options: [
			{ name: 'CSV', value: 'csv', description: 'Human-readable, opens in Excel' },
			{ name: 'JSON', value: 'json', description: 'Programmatic, preserves nested structures' },
		],
		description: 'Export file format',
	},
	{
		displayName: 'Filter Keys',
		name: 'filterKeys',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['run'], operation: ['exportResults'] },
		},
		description:
			'Comma-separated list of field keys to include. Leave empty to include all. Field names come from Get Results → columns.',
		placeholder: 'title,price,url',
	},

	// ---------------- Get Logs ----------------
	{
		...runSlugField,
		displayOptions: {
			show: { resource: ['run'], operation: ['getLogs'] },
		},
	},

	// ---------------- Abort ----------------
	{
		...runSlugField,
		displayOptions: {
			show: { resource: ['run'], operation: ['abort'] },
		},
	},

	// ---------------- Rerun ----------------
	{
		...runSlugField,
		displayOptions: {
			show: { resource: ['run'], operation: ['rerun'] },
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: { resource: ['run'], operation: ['rerun'] },
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
