import type {
	IDataObject,
	ICredentialTestFunctions,
	ICredentialTestFunction,
	IExecuteFunctions,
	INodeExecutionData,
	INodeCredentialTestResult,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { accountFields, accountOperations } from './descriptions/AccountDescription';
import { proxyFields, proxyOperations } from './descriptions/ProxyDescription';
import { storeWorkerFields, storeWorkerOperations } from './descriptions/StoreWorkerDescription';
import { workerFields, workerOperations } from './descriptions/WorkerDescription';
import { workerRunFields, workerRunOperations } from './descriptions/WorkerRunDescription';
import { workerTaskFields, workerTaskOperations } from './descriptions/WorkerTaskDescription';
import { CORECLAW_DEFAULT_BASE_URL } from './constants';
import type { CoreClawEnvelope } from './types';
import { locatorMethods } from './resources/locators';
import { routeCoreClawOperation } from './resources/router';

type CredentialHttpRequest = (uriOrObject: string | object, options?: object) => Promise<unknown>;
interface CoreClawCredentialTestHelpers {
	httpRequest?: CredentialHttpRequest;
	request?: CredentialHttpRequest;
}

export class CoreClaw implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CoreClaw',
		name: 'coreClaw',
		icon: { light: 'file:coreclaw.svg', dark: 'file:coreclaw.dark.svg' },
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Run CoreClaw workers, manage worker runs, fetch results, and inspect account data',
		defaults: {
			name: 'CoreClaw',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'coreClawApi',
				required: true,
				testedBy: 'coreClawApiCredentialTest',
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Proxy', value: 'proxy' },
					{ name: 'Store Worker', value: 'storeWorker' },
					{ name: 'Worker', value: 'worker' },
					{ name: 'Worker Run', value: 'workerRun' },
					{ name: 'Worker Task', value: 'workerTask' },
				],
				default: 'storeWorker',
			},
			...storeWorkerOperations,
			...storeWorkerFields,
			...workerOperations,
			...workerFields,
			...workerRunOperations,
			...workerRunFields,
			...workerTaskOperations,
			...workerTaskFields,
			...proxyOperations,
			...proxyFields,
			...accountOperations,
			...accountFields,
		],
	};

	methods = {
		listSearch: locatorMethods,
		credentialTest: {
			coreClawApiCredentialTest,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const result = await routeCoreClawOperation.call(this, i);
				returnData.push(...result.map((item) => ({ ...item, pairedItem: { item: i } })));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: compactErrorOutput({
							error: (error as Error).message,
							errorDescription: (error as { description?: string }).description ?? '',
							coreclawCode: (error as { coreclawCode?: number }).coreclawCode,
							requestId: (error as { requestId?: string }).requestId,
							details: normalizeErrorDetails((error as { details?: unknown }).details),
						}),
						pairedItem: { item: i },
					});
					continue;
				}

				if (error instanceof NodeApiError || error instanceof NodeOperationError) throw error;
				throw error;
			}
		}

		return [returnData];
	}
}

const coreClawApiCredentialTest: ICredentialTestFunction = async function (
	this: ICredentialTestFunctions,
	credential,
): Promise<INodeCredentialTestResult> {
	const data = credential.data ?? {};
	const apiKey = String(data.apiKey ?? '');
	const baseUrl = String(data.baseUrl || CORECLAW_DEFAULT_BASE_URL).replace(/\/$/, '');
	const request = getCredentialTestRequest(this.helpers);
	if (!request) {
		return {
			status: 'Error',
			message: 'CoreClaw credential test is not supported by this n8n runtime.',
		};
	}

	try {
		const response = (await request({
			method: 'GET',
			url: `${baseUrl}/api/v2/users/account`,
			json: true,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'api-key': apiKey,
				Authorization: `Bearer ${apiKey}`,
			},
		})) as CoreClawEnvelope;

		if (response?.code === 0) {
			return { status: 'OK', message: 'Connection successful' };
		}

		return {
			status: 'Error',
			message: formatCredentialError(response),
		};
	} catch (error) {
		return {
			status: 'Error',
			message: `CoreClaw credential test failed: ${(error as Error).message}`,
		};
	}
};

function getCredentialTestRequest(helpers: ICredentialTestFunctions['helpers']): CredentialHttpRequest | undefined {
	const credentialHelpers = helpers as unknown as CoreClawCredentialTestHelpers;
	return credentialHelpers.httpRequest ?? credentialHelpers['request'];
}

function formatCredentialError(response: CoreClawEnvelope): string {
	if (!response || typeof response.code !== 'number') {
		return 'Unexpected CoreClaw response shape during credential test';
	}

	return [
		`CoreClaw error ${response.code}`,
		response.message,
		response.request_id ? `request_id: ${response.request_id}` : '',
		formatCredentialDetails(response.details),
	]
		.filter(Boolean)
		.join(' | ');
}

function formatCredentialDetails(details: unknown): string {
	if (details === undefined || details === null || details === '') return '';
	if (Array.isArray(details)) return details.map((detail) => String(detail)).filter(Boolean).join('; ');
	if (typeof details === 'string') return details;

	try {
		return JSON.stringify(details) || String(details);
	} catch {
		return String(details);
	}
}

function normalizeErrorDetails(details: unknown): IDataObject | string[] | string | undefined {
	if (details === undefined || details === null || details === '') return undefined;
	if (Array.isArray(details)) return details.map((detail) => formatCredentialDetails(detail));
	if (typeof details === 'object') return details as IDataObject;
	return String(details);
}

function compactErrorOutput(data: IDataObject): IDataObject {
	const compacted: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined && value !== null && value !== '') compacted[key] = value;
	}
	return compacted as IDataObject;
}
