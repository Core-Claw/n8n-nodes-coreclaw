import { CORECLAW_DEFAULT_TIMEOUT_MS } from '../constants';
import { coreClawApiRequest, parseJsonParameter } from '../GenericFunctions';

function createContext(response: unknown, credentials = {}) {
	return {
		getNode: () => ({ name: 'CoreClaw', type: 'n8n-nodes-coreclaw.coreClaw' }),
		getCredentials: jest.fn().mockResolvedValue({
			apiKey: 'test-key',
			baseUrl: 'https://openapi.coreclaw.com/',
			...credentials,
		}),
		helpers: {
			httpRequestWithAuthentication: jest.fn().mockResolvedValue(response),
		},
	} as any;
}

describe('coreClawApiRequest', () => {
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
});

describe('parseJsonParameter', () => {
	it('accepts object values', () => {
		const context = { getNode: () => ({ name: 'CoreClaw' }) } as any;
		expect(parseJsonParameter.call(context, { keyword: 'coffee' }, 'Input JSON', 0)).toEqual({
			keyword: 'coffee',
		});
	});

	it('parses JSON strings', () => {
		const context = { getNode: () => ({ name: 'CoreClaw' }) } as any;
		expect(parseJsonParameter.call(context, '{"keyword":"coffee"}', 'Input JSON', 0)).toEqual({
			keyword: 'coffee',
		});
	});

	it('rejects invalid JSON strings', () => {
		const context = { getNode: () => ({ name: 'CoreClaw' }) } as any;

		expect(() => parseJsonParameter.call(context, '{"keyword":', 'Input JSON', 0)).toThrow(
			'Input JSON is not valid JSON',
		);
	});

	it('rejects primitive JSON values', () => {
		const context = { getNode: () => ({ name: 'CoreClaw' }) } as any;

		expect(() => parseJsonParameter.call(context, '"coffee"', 'Input JSON', 0)).toThrow(
			'Input JSON must parse to a JSON object or array',
		);
	});
});
