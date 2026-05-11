import type { INodeProperties } from 'n8n-workflow';

export const scraperOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['scraper'],
			},
		},
		options: [
			{
				name: 'Search',
				value: 'search',
				description: 'Search the CoreClaw marketplace for ready-to-run scrapers by keyword',
				action: 'Search scrapers',
			},
			{
				name: 'Get Details',
				value: 'getDetails',
				description:
					'Fetch the full spec of a scraper (current version, system defaults, custom input schema, README)',
				action: 'Get scraper details',
			},
			{
				name: 'Run',
				value: 'run',
				description: 'Start an asynchronous scraper run with custom parameters',
				action: 'Run a scraper',
			},
		],
		default: 'search',
	},
];

export const scraperFields: INodeProperties[] = [
	// ---------------- Search ----------------
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['scraper'],
				operation: ['search'],
			},
		},
		description:
			'Keyword matched against scraper title / description / tags. Use empty string to list all scrapers.',
		placeholder: 'amazon, google maps, twitter',
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
				resource: ['scraper'],
				operation: ['search'],
			},
		},
		description: 'Max number of results to return',
	},

	// ---------------- Get Details ----------------
	{
		displayName: 'Scraper',
		name: 'scraperSlug',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['scraper'],
				operation: ['getDetails'],
			},
		},
		description: 'Pick from the marketplace, or paste a slug',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchScrapers',
					searchable: true,
				},
			},
			{
				displayName: 'By Slug',
				name: 'id',
				type: 'string',
				placeholder: 'amazon-product-scraper',
			},
		],
	},

	// ---------------- Run ----------------
	{
		displayName: 'Scraper',
		name: 'scraperSlug',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['scraper'],
				operation: ['run'],
			},
		},
		description: 'Pick from the marketplace, or paste a slug',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchScrapers',
					searchable: true,
				},
			},
			{
				displayName: 'By Slug',
				name: 'id',
				type: 'string',
				placeholder: 'amazon-product-scraper',
			},
		],
	},
	{
		displayName: 'Version',
		name: 'version',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['scraper'],
				operation: ['run'],
			},
		},
		description:
			'Scraper version string. Obtain from Get Details → version. Do NOT invent or guess.',
		placeholder: 'v1.2.3',
	},
	{
		displayName: 'Custom Parameters',
		name: 'customParams',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				resource: ['scraper'],
				operation: ['run'],
			},
		},
		description:
			'Scraper-specific input parameters. Schema comes from Get Details → custom_params_schema.',
		typeOptions: {
			rows: 6,
		},
		placeholder: '{\n  "startURLs": [{"url": "https://amazon.com/dp/B001"}],\n  "proxy_region": "US"\n}',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['scraper'],
				operation: ['run'],
			},
		},
		options: [
			{
				displayName: 'System Parameters',
				name: 'systemParams',
				type: 'json',
				default: '',
				description:
					'JSON of system resource overrides: cpus, memory, execute_limit_time_seconds, max_total_charge, max_total_traffic. Defaults from Get Details → system_params.',
				typeOptions: { rows: 4 },
				placeholder:
					'{"cpus": 1, "memory": 1024, "execute_limit_time_seconds": 3600}',
			},
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
