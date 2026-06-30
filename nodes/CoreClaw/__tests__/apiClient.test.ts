jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import type { IExecuteFunctions } from 'n8n-workflow';
import { sleep } from 'n8n-workflow';

import { CoreClawApi } from '../../../credentials/CoreClawApi.credentials';
import { CORECLAW_DEFAULT_TIMEOUT_MS } from '../constants';
import { coreClawApiRequest, parseJsonParameter, splitCsv } from '../GenericFunctions';

function createContext(response: unknown, credentials = {}) {
	const httpRequestWithAuthentication =
		typeof response === 'function' ? response : jest.fn().mockResolvedValue(response);

	return {
		getNode: () => ({ name: 'CoreClaw', type: 'n8n-nodes-coreclaw.coreClaw' }),
		getCredentials: jest.fn().mockResolvedValue({
			apiKey: 'test-key',
			baseUrl: 'https://openapi.coreclaw.com/',
			...credentials,
		}),
		helpers: {
			httpRequestWithAuthentication,
		},
	} as unknown as IExecuteFunctions;
}

function createJsonContext(): IExecuteFunctions {
	return { getNode: () => ({ name: 'CoreClaw' }) } as unknown as IExecuteFunctions;
}

describe('coreClawApiRequest', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('exposes only the v2 object-argument request signature', () => {
		expect(coreClawApiRequest.length).toBe(1);
	});

	it('unwraps successful CoreClaw envelopes', async () => {
		const context = createContext({ code: 0, message: 'success', data: { ok: true } });

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).resolves.toEqual({ ok: true });
	});

	it('throws on CoreClaw non-zero code', async () => {
		const context = createContext({
			code: 12001,
			message: 'authentication required',
			request_id: 'req-1',
			details: ['bad token'],
		});

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toThrow('CoreClaw error 12001');
	});

	it('throws on missing envelope code', async () => {
		const context = createContext({ ok: true });

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toThrow('Unexpected CoreClaw response shape');
	});

	it('sends v2 authentication headers and maps request options', async () => {
		const context = createContext({ code: 0, data: { ok: true } });

		await coreClawApiRequest.call(context, {
			method: 'POST',
			path: '/api/v2/workers/run',
			qs: { wait: true },
			body: { input: { keyword: 'coffee' } },
		});

		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith('coreClawApi', {
			method: 'POST',
			url: 'https://openapi.coreclaw.com/api/v2/workers/run',
			json: true,
			timeout: CORECLAW_DEFAULT_TIMEOUT_MS,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'api-key': 'test-key',
				Authorization: 'Bearer test-key',
			},
			qs: { wait: true },
			body: { input: { keyword: 'coffee' } },
		});
	});

	it('includes request_id and details in envelope error descriptions', async () => {
		const context = createContext({
			code: 12001,
			message: 'authentication required',
			request_id: 'req-1',
			details: ['bad token'],
		});

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toMatchObject({
			description: expect.stringContaining('bad token'),
		});
		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toMatchObject({
			description: expect.stringContaining('request_id: req-1'),
		});
	});

	it('does not retry failed requests by default', async () => {
		const request = jest.fn().mockRejectedValue(new Error('network down'));
		const context = createContext(request);

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toThrow('CoreClaw request failed');

		expect(request).toHaveBeenCalledTimes(1);
		expect(sleep).not.toHaveBeenCalled();
	});

	it('does not retry failed requests when retrySafe is false', async () => {
		const request = jest.fn().mockRejectedValue(new Error('network down'));
		const context = createContext(request);

		await expect(
			coreClawApiRequest.call(context, {
				method: 'GET',
				path: '/api/v2/users/account',
				retrySafe: false,
			}),
		).rejects.toThrow('CoreClaw request failed');

		expect(request).toHaveBeenCalledTimes(1);
		expect(sleep).not.toHaveBeenCalled();
	});

	it('retries retry-safe rate limited requests and returns a later success', async () => {
		const request = jest
			.fn()
			.mockRejectedValueOnce({ message: 'rate limited', httpCode: 429 })
			.mockResolvedValueOnce({ code: 0, data: { ok: true } });
		const context = createContext(request);

		await expect(
			coreClawApiRequest.call(context, {
				method: 'GET',
				path: '/api/v2/workers/runs/run-1',
				retrySafe: true,
			}),
		).resolves.toEqual({ ok: true });

		expect(request).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledTimes(1);
	});

	it('retries retry-safe 5xx requests and returns a later success', async () => {
		const request = jest
			.fn()
			.mockRejectedValueOnce({ message: 'temporarily unavailable', httpCode: 503 })
			.mockResolvedValueOnce({ code: 0, data: { ok: true } });
		const context = createContext(request);

		await expect(
			coreClawApiRequest.call(context, {
				method: 'GET',
				path: '/api/v2/workers/runs/run-1',
				retrySafe: true,
			}),
		).resolves.toEqual({ ok: true });

		expect(request).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledTimes(1);
	});

	it('does not retry retry-safe 4xx requests other than rate limits', async () => {
		const request = jest.fn().mockRejectedValue({ message: 'bad request', httpCode: 400 });
		const context = createContext(request);

		await expect(
			coreClawApiRequest.call(context, {
				method: 'GET',
				path: '/api/v2/workers/runs/run-1',
				retrySafe: true,
			}),
		).rejects.toThrow('CoreClaw request failed');

		expect(request).toHaveBeenCalledTimes(1);
		expect(sleep).not.toHaveBeenCalled();
	});

	it('bounds retry-safe failures at five total attempts', async () => {
		const request = jest.fn().mockRejectedValue({ message: 'server error', httpCode: 500 });
		const context = createContext(request);

		await expect(
			coreClawApiRequest.call(context, {
				method: 'GET',
				path: '/api/v2/workers/runs/run-1',
				retrySafe: true,
			}),
		).rejects.toThrow('CoreClaw request failed');

		expect(request).toHaveBeenCalledTimes(5);
		expect(sleep).toHaveBeenCalledTimes(4);
	});

	it('uses a fallback description when CoreClaw provides no error detail', async () => {
		const context = createContext({ code: 99999 });

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toMatchObject({
			description: expect.stringContaining('No additional detail provided by CoreClaw.'),
		});
	});

	it('includes serialized non-array details in envelope error descriptions', async () => {
		const context = createContext({
			code: 11000,
			details: { field: 'x' },
		});

		await expect(
			coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' }),
		).rejects.toMatchObject({
			description: expect.stringContaining('{"field":"x"}'),
		});
	});
});

describe('parseJsonParameter', () => {
	it('accepts object values', () => {
		const context = createJsonContext();
		expect(parseJsonParameter.call(context, { keyword: 'coffee' }, 'Input JSON', 0)).toEqual({
			keyword: 'coffee',
		});
	});

	it('parses JSON strings', () => {
		const context = createJsonContext();
		expect(parseJsonParameter.call(context, '{"keyword":"coffee"}', 'Input JSON', 0)).toEqual({
			keyword: 'coffee',
		});
	});

	it('rejects invalid JSON strings', () => {
		const context = createJsonContext();

		expect(() => parseJsonParameter.call(context, '{"keyword":', 'Input JSON', 0)).toThrow(
			'Input JSON is not valid JSON',
		);
	});

	it('rejects primitive JSON values', () => {
		const context = createJsonContext();

		expect(() => parseJsonParameter.call(context, '"coffee"', 'Input JSON', 0)).toThrow(
			'Input JSON must parse to a JSON object or array',
		);
	});
});

describe('splitCsv', () => {
	it('preserves comma-separated values after trimming surrounding whitespace', () => {
		expect(splitCsv(' id,name , status ')).toEqual(['id', 'name', 'status']);
	});

	it('preserves internal whitespace inside values', () => {
		expect(splitCsv('run id, worker name')).toEqual(['run id', 'worker name']);
	});

	it('drops empty comma segments', () => {
		expect(splitCsv('id,, ,status')).toEqual(['id', 'status']);
	});
});

describe('CoreClawApi credentials', () => {
	it('tests credentials against the v2 account endpoint', () => {
		const credential = new CoreClawApi();

		expect(credential.test.request.url).toBe('/api/v2/users/account');
		expect(credential.test.request.method).toBe('GET');
	});

	it('authenticates v2 requests with api-key and bearer headers', () => {
		const credential = new CoreClawApi();

		expect(credential.authenticate.properties.headers).toMatchObject({
			'api-key': '={{$credentials.apiKey}}',
			Authorization: '=Bearer {{$credentials.apiKey}}',
		});
	});
});
