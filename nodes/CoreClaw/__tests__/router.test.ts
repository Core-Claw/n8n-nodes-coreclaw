jest.mock('../GenericFunctions', () => ({
	coreClawApiRequest: jest.fn(),
	parseJsonParameter: jest.requireActual('../GenericFunctions').parseJsonParameter,
}));

import { coreClawApiRequest } from '../GenericFunctions';
import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildRequestFromSpec, replacePathParams, routeCoreClawOperation } from '../resources/router';
import { getEndpointSpec } from '../resources/endpointSpecs';

const mockedRequest = coreClawApiRequest as jest.MockedFunction<typeof coreClawApiRequest>;

function createRouteContext(values: Record<string, unknown>): IExecuteFunctions {
	return {
		getNode: () => ({ name: 'CoreClaw' }),
		getNodeParameter: jest.fn((name: string, _itemIndex: number, defaultValue?: unknown) =>
			Object.prototype.hasOwnProperty.call(values, name) ? values[name] : defaultValue,
		),
		helpers: {
			returnJsonArray: jest.fn((rows: unknown[]) => rows.map((json) => ({ json }))),
		},
	} as unknown as IExecuteFunctions;
}

afterEach(() => {
	mockedRequest.mockReset();
});

describe('router request building', () => {
	it('replaces path parameters using encoded values', () => {
		expect(replacePathParams('/api/v2/workers/{workerId}', { workerId: 'owner~demo worker' })).toBe(
			'/api/v2/workers/owner~demo%20worker',
		);
	});

	it('maps GET params to query string', () => {
		const spec = getEndpointSpec('workerRun', 'list');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			offset: 1,
			limit: 20,
			status: 'succeeded',
			worker_id: 'demo',
		});

		expect(request).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs',
			qs: { offset: 1, limit: 20, status: 'succeeded', worker_id: 'demo' },
		});
	});

	it('maps POST params to body and path', () => {
		const spec = getEndpointSpec('worker', 'run');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			workerId: 'demo',
			input_json: { keyword: 'coffee' },
			is_async: true,
		});

		expect(request.path).toBe('/api/v2/workers/demo/runs');
		expect(request.body).toEqual({
			input: { parameters: { custom: { keyword: 'coffee' } } },
			is_async: true,
		});
	});

	it('maps raw worker input without sending the input json default', () => {
		const spec = getEndpointSpec('worker', 'run');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			workerId: 'demo',
			input_json: '',
			raw_input_json: { parameters: { custom: { keyword: 'coffee' } } },
			is_async: true,
		});

		expect(request.body).toEqual({
			input: { parameters: { custom: { keyword: 'coffee' } } },
			is_async: true,
		});
	});

	it('throws before building a path when a required path parameter is blank', () => {
		const spec = getEndpointSpec('worker', 'run');
		expect(spec).toBeDefined();

		const buildRequest = () =>
			buildRequestFromSpec(spec!, {
				workerId: '   ',
				input_json: { keyword: 'coffee' },
			});

		expect(buildRequest).toThrow(NodeOperationError);
		expect(buildRequest).toThrow('Worker ID is required');
	});

	it('wraps input_json as input.parameters.custom when creating a worker task', () => {
		const spec = getEndpointSpec('workerTask', 'create');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			worker_id: 'coreclaw~google-search-scraper',
			title: 'Daily Search',
			input_json: { keyword: 'coffee', max_pages: '1' },
		});

		expect(request.method).toBe('POST');
		expect(request.path).toBe('/api/v2/worker-tasks');
		expect(request.body).toEqual({
			worker_id: 'coreclaw~google-search-scraper',
			title: 'Daily Search',
			input: { parameters: { custom: { keyword: 'coffee', max_pages: '1' } } },
		});
	});

	it('wraps input_json as input.parameters.custom when updating a worker task input', () => {
		const spec = getEndpointSpec('workerTask', 'updateInput');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			workerTaskId: 'task_1',
			input_json: { keyword: 'coffee' },
		});

		expect(request.method).toBe('PUT');
		expect(request.path).toBe('/api/v2/worker-tasks/task_1/input');
		expect(request.body).toEqual({
			input: { parameters: { custom: { keyword: 'coffee' } } },
		});
	});

	it('wraps input_json as input.parameters.custom when queueing a worker run', () => {
		const spec = getEndpointSpec('runQueue', 'queueRun');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			workerId: 'demo',
			input_json: { keyword: 'coffee' },
			is_async: true,
		});

		expect(request.method).toBe('POST');
		expect(request.path).toBe('/api/v2/workers/demo/queued-runs');
		expect(request.body).toEqual({
			input: { parameters: { custom: { keyword: 'coffee' } } },
			is_async: true,
		});
	});

	it('maps run queue list query params including status', () => {
		const spec = getEndpointSpec('runQueue', 'list');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			offset: 1,
			limit: 20,
			status: 'waiting',
		});

		expect(request).toMatchObject({
			method: 'GET',
			path: '/api/v2/run-queue/items',
			qs: { offset: 1, limit: 20, status: 'waiting' },
		});
	});

	it('sends queue_refs in the body when activating run queue items', () => {
		const spec = getEndpointSpec('runQueue', 'activate');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			queue_refs: ['22', '23'],
		});

		expect(request.method).toBe('POST');
		expect(request.path).toBe('/api/v2/run-queue/items/activate');
		expect(request.body).toEqual({ queue_refs: ['22', '23'] });
	});

	it('sends queue_refs and reason in the body when releasing run queue items', () => {
		const spec = getEndpointSpec('runQueue', 'release');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			queue_refs: ['22', '23'],
			reason: 'no longer needed',
		});

		expect(request.method).toBe('POST');
		expect(request.path).toBe('/api/v2/run-queue/items/release');
		expect(request.body).toEqual({ queue_refs: ['22', '23'], reason: 'no longer needed' });
	});

	it('substitutes the queueId path placeholder when releasing a single run queue item', () => {
		const spec = getEndpointSpec('runQueue', 'releaseOne');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			queueId: '22',
			reason: 'duplicate',
		});

		expect(request.method).toBe('POST');
		expect(request.path).toBe('/api/v2/run-queue/items/22/release');
		expect(request.body).toEqual({ reason: 'duplicate' });
	});

	it('passes start_time and end_time as query params on workerRun.list', () => {
		const spec = getEndpointSpec('workerRun', 'list');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			offset: 1,
			limit: 20,
			start_time: 1696118400,
			end_time: 1696713600,
		});

		expect(request).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs',
			qs: { offset: 1, limit: 20, start_time: 1696118400, end_time: 1696713600 },
		});
	});

	it('throws when a required body parameter is blank (e.g. empty queue_refs)', () => {
		const spec = getEndpointSpec('runQueue', 'activate');
		expect(spec).toBeDefined();

		const buildRequest = () => buildRequestFromSpec(spec!, { queue_refs: '' });

		expect(buildRequest).toThrow(NodeOperationError);
		expect(buildRequest).toThrow('Queue Refs is required');
	});

	it('converts owner/name worker paths to owner~name before URL encoding', () => {
		const spec = getEndpointSpec('worker', 'run');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			workerId: 'coreclaw/google-maps-scraper',
			input_json: { keyword: 'coffee' },
		});

		expect(request.path).toBe('/api/v2/workers/coreclaw~google-maps-scraper/runs');
	});

	it('normalizes offset 0 to page 1 when fetching all pages', async () => {
		const fullPage = Array.from({ length: 100 }, (_, i) => ({ slug: `r${i}` }));
		mockedRequest
			.mockResolvedValueOnce({ list: fullPage, count: 100 })
			.mockResolvedValueOnce({ list: [], count: 0 });

		const context = createRouteContext({
			resource: 'workerRun',
			operation: 'list',
			returnAll: true,
			offset: 0,
			limit: 50,
		});

		await routeCoreClawOperation.call(context, 0);

		// First page requested with offset 1 (0 normalized), second page offset 2.
		expect(mockedRequest.mock.calls[0][0]).toMatchObject({ qs: { offset: 1 } });
		expect(mockedRequest.mock.calls[1][0]).toMatchObject({ qs: { offset: 2 } });
	});
});

describe('routeCoreClawOperation', () => {
	it('polls a worker run until terminal status when wait for finish is enabled', async () => {
		mockedRequest
			.mockResolvedValueOnce({ run_slug: 'run-1' })
			.mockResolvedValueOnce({ slug: 'run-1', status: 'running' })
			.mockResolvedValueOnce({ slug: 'run-1', status: 'succeeded', results: 2 });

		const context = createRouteContext({
			resource: 'worker',
			operation: 'run',
			workerId: 'demo',
			input_json: { keyword: 'coffee' },
			is_async: true,
			offset: 1,
			limit: 50,
			waitForFinish: true,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toEqual([{ json: { slug: 'run-1', status: 'succeeded', results: 2 } }]);
		expect(mockedRequest).toHaveBeenCalledTimes(3);
		expect(mockedRequest.mock.calls[1][0]).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs/run-1',
			retrySafe: true,
		});
		expect(mockedRequest.mock.calls[2][0]).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs/run-1',
			retrySafe: true,
		});
	});

	it('runs with raw input only through the node parameter defaults', async () => {
		mockedRequest.mockResolvedValueOnce({ run_slug: 'run-1' });

		const context = createRouteContext({
			resource: 'worker',
			operation: 'run',
			workerId: 'demo',
			input_json: '',
			raw_input_json: { parameters: { custom: { keyword: 'tea' } } },
			is_async: true,
			offset: 1,
			limit: 50,
			waitForFinish: false,
		});

		await routeCoreClawOperation.call(context, 0);

		expect(mockedRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				body: {
					input: { parameters: { custom: { keyword: 'tea' } } },
					is_async: true,
					offset: 1,
					limit: 50,
				},
			}),
		);
	});

	it('fetches beyond the hidden default limit when returnAll pages are full', async () => {
		const firstPage = Array.from({ length: 100 }, (_, index) => ({ row: index }));
		const secondPage = Array.from({ length: 25 }, (_, index) => ({ row: index + 100 }));
		mockedRequest
			.mockResolvedValueOnce({ items: firstPage })
			.mockResolvedValueOnce({ items: secondPage });

		const context = createRouteContext({
			resource: 'worker',
			operation: 'list',
			returnAll: true,
			offset: 1,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toHaveLength(125);
		expect(mockedRequest).toHaveBeenCalledTimes(2);
		expect(mockedRequest.mock.calls[0][0]).toMatchObject({
			qs: { offset: 1, limit: 100 },
		});
		expect(mockedRequest.mock.calls[1][0]).toMatchObject({
			qs: { offset: 2, limit: 100 },
		});
	});

	it('stops returnAll after the 10000 row safety guard when pages stay full', async () => {
		const fullPage = Array.from({ length: 100 }, (_, index) => ({ row: index }));
		mockedRequest.mockImplementation(async () => {
			if (mockedRequest.mock.calls.length > 100) {
				throw new Error('returnAll pagination exceeded safety guard');
			}

			return { items: fullPage };
		});

		const context = createRouteContext({
			resource: 'worker',
			operation: 'list',
			returnAll: true,
			offset: 1,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toHaveLength(10000);
		expect(mockedRequest).toHaveBeenCalledTimes(100);
		expect(mockedRequest.mock.calls[99][0]).toMatchObject({
			qs: { offset: 100, limit: 100 },
		});
	});
});
