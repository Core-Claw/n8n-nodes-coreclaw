import { extractItems, nextOffset } from '../resources/pagination';

describe('pagination helpers', () => {
	it.each(['items', 'records', 'list', 'results'])('extracts arrays from %s', (key) => {
		expect(extractItems({ [key]: [{ id: 1 }] })).toEqual([{ id: 1 }]);
	});

	it('uses direct array input', () => {
		expect(extractItems([{ id: 1 }])).toEqual([{ id: 1 }]);
	});

	it('uses data when data is an array', () => {
		expect(extractItems({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
	});

	it.each([undefined, null, 'text', 1])('returns undefined for non-object input %p', (input) => {
		expect(extractItems(input)).toBeUndefined();
	});

	it('returns undefined for ambiguous objects', () => {
		expect(extractItems({ id: 1, title: 'single object' })).toBeUndefined();
	});

	it('increments offset by fetched row count', () => {
		expect(nextOffset(20, [{}, {}, {}])).toBe(23);
	});
});
