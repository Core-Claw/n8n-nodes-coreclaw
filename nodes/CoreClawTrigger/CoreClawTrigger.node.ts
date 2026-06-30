import type {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { triggerProperties } from './descriptions';

export class CoreClawTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CoreClaw Trigger',
		name: 'coreClawTrigger',
		icon: { light: 'file:../CoreClaw/coreclaw.svg', dark: 'file:../CoreClaw/coreclaw.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when CoreClaw sends a run callback',
		defaults: {
			name: 'CoreClaw Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'callback',
			},
		],
		properties: triggerProperties,
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const eventFilter = this.getNodeParameter('eventFilter') as string;
		const validatePayload = this.getNodeParameter('validatePayload') as boolean;
		const includeHeaders = this.getNodeParameter('includeHeaders') as boolean;

		if (validatePayload && (body.run_id === undefined || body.run_status === undefined)) {
			throw new NodeOperationError(this.getNode(), 'CoreClaw callback payload must include run_id and run_status');
		}

		const status = String(body.run_status ?? '').toLowerCase();
		if (eventFilter !== 'any' && status !== eventFilter) {
			return { workflowData: [[]] };
		}

		const output: IDataObject = { ...body };
		if (includeHeaders) output._headers = this.getHeaderData() as IDataObject;

		return {
			workflowData: [this.helpers.returnJsonArray([output])],
		};
	}
}
