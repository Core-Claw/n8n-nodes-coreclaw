import { CoreClawTrigger } from '../CoreClawTrigger.node';

// Payload shape follows the documented v2 callback contract
// (scraper-webui-docs src/content/docs/api/callbacks.md): run_slug is the
// platform run identifier, not run_id.
const v2CallbackPayload = {
	run_slug: '01KZDQ89G8PTTWG5Z703BG7D1T',
	run_status: 'succeeded',
	error_message: '',
	execution_start_timestamp: 100,
	execution_end_timestamp: 200,
	running_duration: 100,
	result_count: 3,
	result_message: 'done',
};

describe('CoreClawTrigger webhook', () => {
	it('emits callback payloads that match PlatformCallbackRequest shape', async () => {
		const node = new CoreClawTrigger();
		const context = {
			getBodyData: () => v2CallbackPayload,
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
			workflowData: [[{ json: v2CallbackPayload }]],
		});
	});

	it('filters out non-matching statuses', async () => {
		const node = new CoreClawTrigger();
		const context = {
			getBodyData: () => ({ ...v2CallbackPayload, run_status: 'failed' }),
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

	it('rejects v1-style payloads without run_slug when validation is enabled', async () => {
		const node = new CoreClawTrigger();
		const context = {
			getNode: () => ({ name: 'CoreClawTrigger' }),
			getBodyData: () => ({ run_id: 123, run_status: 'succeeded' }),
			getHeaderData: () => ({}),
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

		await expect(node.webhook.call(context as never)).rejects.toThrow('run_slug and run_status');
	});
});
