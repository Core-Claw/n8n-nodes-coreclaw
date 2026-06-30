import type {
	IExecuteFunctions,
	INodeExecutionData,
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
import { locatorMethods } from './resources/locators';
import { routeCoreClawOperation } from './resources/router';

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
						json: {
							error: (error as Error).message,
							errorDescription: (error as { description?: string }).description ?? '',
						},
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
