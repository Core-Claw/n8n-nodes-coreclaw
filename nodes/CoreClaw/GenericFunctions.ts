import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

import {
	CORECLAW_DEFAULT_BASE_URL,
	CORECLAW_DEFAULT_TIMEOUT_MS,
	CORECLAW_ERROR_HINTS,
} from './constants';
import type { CoreClawEnvelope, CoreClawRequestArgs } from './types';

type CoreClawContext = IExecuteFunctions | ILoadOptionsFunctions;

export async function coreClawApiRequest(
	this: CoreClawContext,
	args: CoreClawRequestArgs,
): Promise<unknown> {
	const credentials = await this.getCredentials('coreClawApi');
	const baseUrl = String(credentials.baseUrl || CORECLAW_DEFAULT_BASE_URL).replace(/\/$/, '');
	const apiKey = String(credentials.apiKey || '');

	const options: IHttpRequestOptions = {
		method: args.method,
		url: `${baseUrl}${args.path}`,
		json: true,
		timeout: CORECLAW_DEFAULT_TIMEOUT_MS,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'api-key': apiKey,
			Authorization: `Bearer ${apiKey}`,
		},
	};

	if (args.qs && Object.keys(args.qs).length > 0) options.qs = args.qs;
	if (args.body && Object.keys(args.body).length > 0) options.body = args.body;

	const execute = async () =>
		this.helpers.httpRequestWithAuthentication.call(
			this,
			'coreClawApi',
			options,
		) as Promise<CoreClawEnvelope>;

	let response: CoreClawEnvelope;
	try {
		response = args.retrySafe ? await retryRead(execute) : await execute();
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'CoreClaw request failed',
			description: (error as Error).message,
		});
	}

	return unwrapCoreClawEnvelope.call(this, response);
}

export function unwrapCoreClawEnvelope(this: CoreClawContext, response: CoreClawEnvelope): unknown {
	if (!response || typeof response.code !== 'number') {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: 'Unexpected CoreClaw response shape',
			description: 'Response did not contain a numeric code field.',
		});
	}

	if (response.code !== 0) {
		const hint = CORECLAW_ERROR_HINTS[response.code];
		const details = formatDetails((response as { details?: unknown }).details);
		const descriptionParts = [
			response.message,
			hint,
			details,
			response.request_id ? `request_id: ${response.request_id}` : '',
		]
			.filter(Boolean);
		const description =
			descriptionParts.length > 0
				? descriptionParts.join(' | ')
				: 'No additional detail provided by CoreClaw.';

		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: `CoreClaw error ${response.code}`,
			description,
			httpCode: String(response.code),
		});
	}

	return response.data;
}

function formatDetails(details: unknown): string {
	if (details === undefined || details === null || details === '') return '';

	if (Array.isArray(details)) {
		return details.map(formatDetailValue).filter(Boolean).join('; ');
	}

	return formatDetailValue(details);
}

function formatDetailValue(value: unknown): string {
	if (value === undefined || value === null) return '';
	if (typeof value === 'string') return value;

	try {
		return JSON.stringify(value) || String(value);
	} catch {
		return String(value);
	}
}

async function retryRead<T>(fn: () => Promise<T>): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			const status = Number((error as { httpCode?: number | string }).httpCode);
			const retryable = Number.isNaN(status) || status === 429 || status >= 500;
			if (!retryable || attempt === 4) break;
			await sleep(1000 * Math.pow(2, attempt));
		}
	}

	throw lastError;
}

export function parseJsonParameter(
	this: IExecuteFunctions,
	value: unknown,
	fieldName: string,
	itemIndex: number,
): IDataObject | unknown[] | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'object') return value as IDataObject | unknown[];

	if (typeof value !== 'string') {
		throw new NodeOperationError(this.getNode(), `${fieldName} must be a JSON object`, {
			itemIndex,
		});
	}

	const trimmed = value.trim();
	if (!trimmed) return undefined;

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`${fieldName} is not valid JSON: ${(error as Error).message}`,
			{ itemIndex },
		);
	}

	if (parsed === null || typeof parsed !== 'object') {
		throw new NodeOperationError(
			this.getNode(),
			`${fieldName} must parse to a JSON object or array`,
			{ itemIndex },
		);
	}

	return parsed as IDataObject | unknown[];
}

export function splitCsv(value: string): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
}
