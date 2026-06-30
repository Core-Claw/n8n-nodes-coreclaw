jest.mock('../GenericFunctions', () => ({
	coreClawApiRequest: jest.fn(),
}));

/* eslint-disable n8n-nodes-base/node-param-description-lowercase-first-char */
/* eslint-disable n8n-nodes-base/node-param-display-name-miscased */

import { coreClawApiRequest } from '../GenericFunctions';
import type { ILoadOptionsFunctions } from 'n8n-workflow';
import {
	formatRunOption,
	formatWorkerOption,
	formatWorkerTaskOption,
	locatorMethods,
	normalizeList,
} from '../resources/locators';

const mockedRequest = coreClawApiRequest as jest.MockedFunction<typeof coreClawApiRequest>;
const loadOptionsContext = {} as unknown as ILoadOptionsFunctions;

afterEach(() => {
	mockedRequest.mockReset();
});

describe('resource locator helpers', () => {
	it('normalizes common list response shapes', () => {
		expect(normalizeList({ items: [{ slug: 'a' }] })).toEqual([{ slug: 'a' }]);
		expect(normalizeList({ records: [{ slug: 'b' }] })).toEqual([{ slug: 'b' }]);
		expect(normalizeList([{ slug: 'c' }])).toEqual([{ slug: 'c' }]);
	});

	it('formats worker options with useful names', () => {
		expect(formatWorkerOption({ title: 'Demo Worker', path: 'demo~worker', description: 'Demo' })).toEqual({
			name: 'Demo Worker (demo~worker)',
			value: 'demo~worker',
			description: 'Demo',
			url: 'https://coreclaw.com/store/demo~worker',
		});
	});

	it('encodes worker store URL path segments', () => {
		expect(formatWorkerOption({ title: 'Demo Worker', path: 'owner/demo worker' })).toEqual({
			name: 'Demo Worker (owner/demo worker)',
			value: 'owner/demo worker',
			description: undefined,
			url: 'https://coreclaw.com/store/owner%2Fdemo%20worker',
		});
	});

	it('formats worker task options with value, name, and description', () => {
		expect(
			formatWorkerTaskOption({
				title: 'Daily Report',
				worker_task_id: ' task-1 ',
				worker_id: 'worker-1',
			}),
		).toEqual({
			name: 'Daily Report (task-1)',
			value: 'task-1',
			description: 'worker-1',
		});
	});

	it('formats run options with status', () => {
		expect(formatRunOption({ run_id: 'run-1', run_status: 'succeeded', worker_id: 'demo' })).toEqual({
			name: 'run-1 (succeeded)',
			value: 'run-1',
			description: 'demo',
		});
	});
});

describe('locatorMethods', () => {
	it('filters whitespace-only option IDs', async () => {
		mockedRequest.mockResolvedValueOnce({
			items: [
				{ title: 'Blank Worker', path: '   ' },
				{ title: 'Demo Worker', path: 'demo-worker' },
			],
		});

		await expect(locatorMethods.searchWorkers.call(loadOptionsContext, 'coffee')).resolves.toEqual({
			results: [
				{
					name: 'Demo Worker (demo-worker)',
					value: 'demo-worker',
					description: undefined,
					url: 'https://coreclaw.com/store/demo-worker',
				},
			],
		});
	});

	it.each([
		{
			method: 'searchStoreWorkers',
			path: '/api/v2/store',
			qs: { keyword: 'coffee', offset: 0, limit: 50 },
			data: { items: [{ title: 'Store Worker', path: 'owner/demo worker' }] },
			results: [
				{
					name: 'Store Worker (owner/demo worker)',
					value: 'owner/demo worker',
					description: undefined,
					url: 'https://coreclaw.com/store/owner%2Fdemo%20worker',
				},
			],
		},
		{
			method: 'searchWorkers',
			path: '/api/v2/workers',
			qs: { keyword: 'coffee', offset: 0, limit: 50 },
			data: { items: [{ title: 'My Worker', worker_id: 'worker-1', description: 'Demo' }] },
			results: [
				{
					name: 'My Worker (worker-1)',
					value: 'worker-1',
					description: 'Demo',
					url: 'https://coreclaw.com/store/worker-1',
				},
			],
		},
		{
			method: 'searchWorkerTasks',
			path: '/api/v2/worker-tasks',
			qs: { keyword: 'coffee', offset: 0, limit: 50 },
			data: { items: [{ title: 'Daily Report', worker_task_id: 'task-1', worker_id: 'worker-1' }] },
			results: [
				{
					name: 'Daily Report (task-1)',
					value: 'task-1',
					description: 'worker-1',
				},
			],
		},
		{
			method: 'searchWorkerRuns',
			path: '/api/v2/worker-runs',
			qs: { worker_id: 'coffee', offset: 0, limit: 50 },
			data: { items: [{ run_id: 'run-1', run_status: 'succeeded', worker_id: 'worker-1' }] },
			results: [
				{
					name: 'run-1 (succeeded)',
					value: 'run-1',
					description: 'worker-1',
				},
			],
		},
	] as const)(
		'$method calls coreClawApiRequest with list-search args and returns formatted results',
		async ({ method, path, qs, data, results }) => {
			mockedRequest.mockResolvedValueOnce(data);

			await expect(locatorMethods[method].call(loadOptionsContext, 'coffee')).resolves.toEqual({ results });
			expect(mockedRequest).toHaveBeenCalledTimes(1);
			expect(mockedRequest.mock.calls[0][0]).toEqual({
				method: 'GET',
				path,
				qs,
				retrySafe: true,
			});
		},
	);
});
