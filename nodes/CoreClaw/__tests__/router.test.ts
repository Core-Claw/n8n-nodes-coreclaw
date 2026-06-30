import { buildRequestFromSpec, replacePathParams } from '../resources/router';
import { getEndpointSpec } from '../resources/endpointSpecs';

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
			offset: 0,
			limit: 20,
			status: 'succeeded',
			worker_id: 'demo',
		});

		expect(request).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs',
			qs: { offset: 0, limit: 20, status: 'succeeded', worker_id: 'demo' },
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
});
