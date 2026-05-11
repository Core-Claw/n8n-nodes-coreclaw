import type {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

interface CoreClawEnvelope {
	code: number;
	message?: string;
	data?: unknown;
}

// These are NOT HTTP status codes; the API always returns HTTP 200 with a `code`
// field in the body. A non-zero `code` is an application-level error.
const CORECLAW_ERROR_HINTS: Record<number, string> = {
	4000: 'Invalid request parameters — check required fields.',
	4010: 'Unauthorized — verify the API key in the CoreClaw credential.',
	4040: 'Resource not found — verify the slug or ID.',
	4290: 'Rate limited — wait a moment and retry.',
	5000: 'CoreClaw server error — retry shortly.',
	10001: 'User not found or unavailable.',
	10002: 'User account disabled — contact CoreClaw support.',
	20001: 'Invalid API key — generate a new one at coreclaw.com → Console → API Keys.',
	20002: 'API key expired — generate a new one at coreclaw.com → Console → API Keys.',
	30001: 'Insufficient account balance — top up at coreclaw.com → Billing.',
	30002: 'Insufficient traffic quota — top up at coreclaw.com → Billing.',
	50001: 'Scraper not found — verify the scraper slug.',
	50002:
		'Scraper run failed — re-check Custom Parameters against Get Details → custom_params_schema (null / missing required fields are a common cause).',
	50003: 'Scraper version not available — re-fetch via Get Details.',
	60001: 'Task not found — verify the task slug in CoreClaw Console → Tasks.',
	70001: 'Run record does not exist — verify the run slug.',
	70002: 'Abort run failed — the run may already be finished.',
};

/**
 * Issue an authenticated request to CoreClaw and unwrap the response envelope.
 * Throws NodeApiError on non-zero `code` so the n8n UI surfaces actionable detail.
 */
export async function coreClawApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<unknown> {
	const credentials = await this.getCredentials('coreClawApi');
	const baseUrl =
		((credentials.baseUrl as string) || 'https://openapi.coreclaw.com').replace(/\/$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${resource}`,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		json: true,
		returnFullResponse: false,
	};

	if (method === 'GET') {
		options.qs = qs;
	} else {
		options.body = body;
	}

	let response: CoreClawEnvelope;
	try {
		response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'coreClawApi',
			options,
		)) as CoreClawEnvelope;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'CoreClaw request failed',
			description: (error as Error).message,
		});
	}

	if (!response || typeof response.code !== 'number') {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: 'Unexpected CoreClaw response shape',
			description: 'Response did not contain a `code` field — the API may have changed.',
		});
	}

	if (response.code !== 0) {
		const hint = CORECLAW_ERROR_HINTS[response.code];
		const description = [response.message, hint].filter(Boolean).join(' — ');
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: `CoreClaw error ${response.code}`,
			description: description || 'No additional detail provided by the server.',
			httpCode: String(response.code),
		});
	}

	return response.data;
}

/**
 * Parse a value that may be either a JSON string or an already-decoded object.
 * Used by Run Scraper / Export filters where users may type JSON in the editor
 * or pass a decoded object via expressions.
 *
 * Returns an object or array. Primitives (string / number / boolean) and `null`
 * are rejected — CoreClaw expects custom_params / system_params to be objects,
 * and JSON.parse('"hi"') silently succeeding would let bogus payloads reach the API.
 */
export function parseJsonParameter(
	this: IExecuteFunctions,
	value: unknown,
	fieldName: string,
	itemIndex: number,
): IDataObject | unknown[] | undefined {
	if (value === undefined || value === null || value === '') return undefined;

	if (typeof value === 'object') {
		// Already a decoded object/array (e.g. via expression). Accept as-is.
		return value as IDataObject;
	}

	if (typeof value !== 'string') {
		throw new NodeOperationError(
			this.getNode(),
			`${fieldName} must be a JSON object — received ${typeof value}`,
			{ itemIndex },
		);
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
			`${fieldName} must parse to a JSON object or array — got ${parsed === null ? 'null' : typeof parsed}`,
			{ itemIndex },
		);
	}

	return parsed as IDataObject | unknown[];
}

/** Convert a comma-separated string into a trimmed array, dropping empty entries. */
export function splitCsv(value: string): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}
