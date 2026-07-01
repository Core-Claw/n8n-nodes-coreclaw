jest.mock('../GenericFunctions', () => ({
	coreClawApiRequest: jest.fn(),
	parseJsonParameter: jest.requireActual('../GenericFunctions').parseJsonParameter,
}));

import { coreClawApiRequest } from '../GenericFunctions';
import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { routeCoreClawOperation } from '../resources/router';

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

describe('composite run-and-get-results operations', () => {
	it('runs a worker, polls to terminal, and returns result rows', async () => {
		mockedRequest
			// trigger: POST /workers/{workerId}/runs
			.mockResolvedValueOnce({ run_slug: 'run-1' })
			// first poll: still running
			.mockResolvedValueOnce({ slug: 'run-1', status: 'running' })
			// second poll: succeeded
			.mockResolvedValueOnce({ slug: 'run-1', status: 'succeeded' })
			// result fetch
			.mockResolvedValueOnce({ list: [{ title: 'a' }, { title: 'b' }] });

		const context = createRouteContext({
			resource: 'worker',
			operation: 'runAndGetResults',
			workerId: 'demo',
			input_json: { keyword: 'coffee' },
			version: '',
			raw_input_json: '',
			is_async: false, // should be forced to true by the composite executor
			offset: 0,
			limit: 50,
			returnAll: false,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toEqual([{ json: { title: 'a' } }, { json: { title: 'b' } }]);

		// Trigger call forces is_async=true and wraps worker input.
		expect(mockedRequest.mock.calls[0][0]).toMatchObject({
			method: 'POST',
			path: '/api/v2/workers/demo/runs',
			body: { input: { parameters: { custom: { keyword: 'coffee' } } }, is_async: true },
		});

		// Polling uses GET /worker-runs/{runId}.
		expect(mockedRequest.mock.calls[1][0]).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs/run-1',
			retrySafe: true,
		});

		// Result fetch hits the result endpoint with pagination query.
		expect(mockedRequest.mock.calls[3][0]).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs/run-1/result',
			qs: { offset: 0, limit: 50 },
			retrySafe: true,
		});
	});

	it('runs a worker task and returns result rows', async () => {
		mockedRequest
			.mockResolvedValueOnce({ run_slug: 'run-task-1' })
			.mockResolvedValueOnce({ slug: 'run-task-1', status: 'succeeded' })
			.mockResolvedValueOnce({ list: [{ ok: true }] });

		const context = createRouteContext({
			resource: 'workerTask',
			operation: 'runAndGetResults',
			workerTaskId: 'task_abc',
			offset: 0,
			limit: 10,
			returnAll: false,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toEqual([{ json: { ok: true } }]);
		expect(mockedRequest.mock.calls[0][0]).toMatchObject({
			method: 'POST',
			path: '/api/v2/worker-tasks/task_abc/runs',
			body: { is_async: true },
		});
	});

	it('reruns a worker run and returns result rows', async () => {
		mockedRequest
			.mockResolvedValueOnce({ run_slug: 'run-re-1' })
			.mockResolvedValueOnce({ slug: 'run-re-1', status: 'succeeded' })
			.mockResolvedValueOnce({ list: [{ n: 1 }] });

		const context = createRouteContext({
			resource: 'workerRun',
			operation: 'rerunAndGetResults',
			runId: 'run-original-1',
			offset: 0,
			limit: 50,
			returnAll: false,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toEqual([{ json: { n: 1 } }]);
		expect(mockedRequest.mock.calls[0][0]).toMatchObject({
			method: 'POST',
			path: '/api/v2/worker-runs/run-original-1/rerun',
		});
	});

	it('paginates result rows when returnAll is enabled', async () => {
		const pageA = Array.from({ length: 100 }, (_, i) => ({ row: i }));
		const pageB = [{ row: 100 }, { row: 101 }];
		mockedRequest
			.mockResolvedValueOnce({ run_slug: 'run-page' })
			.mockResolvedValueOnce({ slug: 'run-page', status: 'succeeded' })
			.mockResolvedValueOnce({ list: pageA })
			.mockResolvedValueOnce({ list: pageB });

		const context = createRouteContext({
			resource: 'worker',
			operation: 'runAndGetResults',
			workerId: 'demo',
			input_json: '',
			raw_input_json: '',
			version: '',
			is_async: true,
			offset: 0,
			limit: 50,
			returnAll: true,
		});

		const result = await routeCoreClawOperation.call(context, 0);

		expect(result).toHaveLength(102);
		expect(mockedRequest.mock.calls[2][0]).toMatchObject({ qs: { offset: 0, limit: 100 } });
		expect(mockedRequest.mock.calls[3][0]).toMatchObject({ qs: { offset: 100, limit: 100 } });
	});

	it('surfaces the run log when the run fails', async () => {
		mockedRequest
			.mockResolvedValueOnce({ run_slug: 'run-fail' })
			.mockResolvedValueOnce({ slug: 'run-fail', status: 'failed', err_msg: 'bad input' })
			.mockResolvedValueOnce('log line 1\nlog line 2');

		const context = createRouteContext({
			resource: 'worker',
			operation: 'runAndGetResults',
			workerId: 'demo',
			input_json: '',
			raw_input_json: '',
			version: '',
			is_async: true,
			offset: 0,
			limit: 50,
			returnAll: false,
		});

		await expect(routeCoreClawOperation.call(context, 0)).rejects.toThrow(NodeOperationError);
		// The failed-run error fetches the log.
		expect(mockedRequest.mock.calls[2][0]).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs/run-fail/log',
		});
	});
});
