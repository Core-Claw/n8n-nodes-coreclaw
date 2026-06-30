import { prepareRunWorkerBody } from '../resources/runInput';

describe('prepareRunWorkerBody', () => {
	it('wraps input_json as input.parameters.custom', () => {
		expect(
			prepareRunWorkerBody({
				input_json: { keyword: 'coffee', limit: 2 },
			}),
		).toEqual({
			input: {
				parameters: {
					custom: { keyword: 'coffee', limit: 2 },
				},
			},
		});
	});

	it('wraps input_json containing parameters as custom input', () => {
		expect(
			prepareRunWorkerBody({
				input_json: { parameters: { custom: { keyword: 'tea' } } },
			}),
		).toEqual({
			input: {
				parameters: {
					custom: { parameters: { custom: { keyword: 'tea' } } },
				},
			},
		});
	});

	it('passes raw_input_json through as input', () => {
		expect(
			prepareRunWorkerBody({
				raw_input_json: {
					parameters: {
						system: { proxy_region: 'US' },
						custom: { keyword: 'coffee' },
					},
				},
			}),
		).toEqual({
			input: {
				parameters: {
					system: { proxy_region: 'US' },
					custom: { keyword: 'coffee' },
				},
			},
		});
	});

	it('rejects input_json and raw_input_json together', () => {
		expect(() =>
			prepareRunWorkerBody({
				input_json: { keyword: 'coffee' },
				raw_input_json: { parameters: { custom: { keyword: 'tea' } } },
			}),
		).toThrow('Use either Input JSON or Raw Input JSON, not both');
	});

	it('keeps normal run body fields and drops empty values', () => {
		expect(
			prepareRunWorkerBody({
				version: '',
				callback_url: 'https://n8n.example/webhook/coreclaw',
				is_async: false,
				offset: 0,
				limit: 20,
			}),
		).toEqual({
			callback_url: 'https://n8n.example/webhook/coreclaw',
			is_async: false,
			offset: 0,
			limit: 20,
		});
	});
});
