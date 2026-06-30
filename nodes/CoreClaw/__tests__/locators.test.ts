import { formatRunOption, formatWorkerOption, normalizeList } from '../resources/locators';

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

	it('formats run options with status', () => {
		expect(formatRunOption({ run_id: 'run-1', run_status: 'succeeded', worker_id: 'demo' })).toEqual({
			name: 'run-1 (succeeded)',
			value: 'run-1',
			description: 'demo',
		});
	});
});
