import type { INodeProperties } from 'n8n-workflow';

const runOperations = ['run'];
const paginationOperations = ['list', 'runAndGetResults'];
const taskTargetOperations = ['run', 'runAndGetResults', 'get', 'update', 'delete', 'getInput', 'updateInput'];
const createOperations = ['create'];
const updateOperations = ['update'];
const updateInputOperations = ['updateInput'];

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
	description: 'Whether to return all results or only up to a given limit',
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
	default: 50,
	displayOptions: {
		show: {
			resource: ['workerTask'],
			operation: operations,
			...(onlyWhenReturnAllIsFalse ? { returnAll: [false] } : {}),
		},
	},
	description: 'Max number of results to return',
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
				name: 'Create',
				value: 'create',
				description: 'Create a saved CoreClaw worker task with input and optional schedule',
				action: 'Create worker task',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a saved CoreClaw worker task',
				action: 'Delete worker task',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a saved CoreClaw worker task',
				action: 'Get worker task',
			},
			{
				name: 'Get Input',
				value: 'getInput',
				description: 'Get the saved input payload of a CoreClaw worker task',
				action: 'Get worker task input',
			},
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
			{
				name: 'Run and Get Results',
				value: 'runAndGetResults',
				description: 'Run a saved worker task, wait for it to finish, and return the result rows in one step',
				action: 'Run worker task and get results',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a saved CoreClaw worker task title, description, or schedule',
				action: 'Update worker task',
			},
			{
				name: 'Update Input',
				value: 'updateInput',
				description: 'Update the saved input payload of a CoreClaw worker task',
				action: 'Update worker task input',
			},
		],
		default: 'list',
	},
];

export const workerTaskFields: INodeProperties[] = [
	returnAllField(paginationOperations),
	offsetField(paginationOperations),
	limitField(paginationOperations, true),
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
	workerTaskIdField(taskTargetOperations),
	callbackUrlField(runOperations),
	isAsyncField(runOperations),
	offsetField(runOperations),
	limitField(runOperations, false),
	waitForFinishField(runOperations),
	{
		displayName: 'Worker ID',
		name: 'worker_id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: createOperations,
			},
		},
		description: 'Worker slug or owner path to save this task against',
		placeholder: 'owner~demo-worker',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		description: 'Task title used for display and search',
	},
	{
		displayName: 'Input JSON',
		name: 'input_json',
		type: 'json',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateInputOperations],
			},
		},
		description: 'Task input JSON. The node sends it as input.parameters.custom.',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		description: 'Task description',
	},
	{
		displayName: 'Version',
		name: 'version',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateInputOperations],
			},
		},
		description: 'Worker script version. Leave empty to use the current worker version.',
	},
	{
		displayName: 'Schedule Type',
		name: 'schedule_type',
		type: 'options',
		default: 1,
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		options: [
			{ name: 'Daily', value: 1 },
			{ name: 'Weekly', value: 2 },
			{ name: 'Monthly', value: 3 },
		],
		description: 'Schedule type: 1=daily, 2=weekly, 3=monthly',
	},
	{
		displayName: 'Schedule Time',
		name: 'schedule_time',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		description: 'Schedule time of day in HH:mm format, for example 09:00',
	},
	{
		displayName: 'Schedule Weekday',
		name: 'schedule_weekday',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 6 },
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		description: 'Day of week for weekly schedules: 0-6, 0=Sunday',
	},
	{
		displayName: 'Schedule Day',
		name: 'schedule_day',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 31 },
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		description: 'Day of month for monthly schedules (1-31)',
	},
	{
		displayName: 'Schedule Once Date',
		name: 'schedule_once_date',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		description: 'Date for one-time schedules in YYYY-MM-DD format',
	},
	{
		displayName: 'Schedule Enabled',
		name: 'schedule_enabled',
		type: 'options',
		default: 0,
		displayOptions: {
			show: {
				resource: ['workerTask'],
				operation: [...createOperations, ...updateOperations],
			},
		},
		options: [
			{ name: 'Disabled', value: 0 },
			{ name: 'Enabled', value: 1 },
		],
		description: 'Schedule switch: 0=disabled, 1=enabled',
	},
];
