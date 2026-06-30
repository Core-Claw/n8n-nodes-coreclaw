import { CoreClawTrigger } from '../CoreClawTrigger.node';

describe('CoreClawTrigger webhook', () => {
	it('emits callback payloads that match PlatformCallbackRequest shape', async () => {
		const node = new CoreClawTrigger();
		const context = {
			getBodyData: () => ({ run_id: 123, run_status: 'succeeded', result_count: 2 }),
			getHeaderData: () => ({ 'x-test': 'yes' }),
			getNodeParameter: (name: string) => {
				if (name === 'eventFilter') return 'any';
				if (name === 'includeHeaders') return false;
				if (name === 'validatePayload') return true;
				return undefined;
			},
			helpers: {
				returnJsonArray: (data: unknown[]) => data.map((json) => ({ json })),
			},
		};

		await expect(node.webhook.call(context as never)).resolves.toEqual({
			workflowData: [[{ json: { run_id: 123, run_status: 'succeeded', result_count: 2 } }]],
		});
	});

	it('filters out non-matching statuses', async () => {
		const node = new CoreClawTrigger();
		const context = {
			getBodyData: () => ({ run_id: 123, run_status: 'failed' }),
			getHeaderData: () => ({}),
			getNodeParameter: (name: string) => {
				if (name === 'eventFilter') return 'succeeded';
				if (name === 'includeHeaders') return false;
				if (name === 'validatePayload') return true;
				return undefined;
			},
			helpers: {
				returnJsonArray: (data: unknown[]) => data.map((json) => ({ json })),
			},
		};

		await expect(node.webhook.call(context as never)).resolves.toEqual({ workflowData: [[]] });
	});
});
