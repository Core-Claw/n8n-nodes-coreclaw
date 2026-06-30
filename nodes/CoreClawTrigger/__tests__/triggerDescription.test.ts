import { CoreClawTrigger } from '../CoreClawTrigger.node';

describe('CoreClawTrigger description', () => {
	it('is a webhook trigger node for CoreClaw callbacks', () => {
		const node = new CoreClawTrigger();

		expect(node.description.name).toBe('coreClawTrigger');
		expect(node.description.webhooks?.[0]).toMatchObject({
			name: 'default',
			httpMethod: 'POST',
			responseMode: 'onReceived',
			path: 'callback',
		});
		expect(JSON.stringify(node.description.properties)).toContain('Event Filter');
	});
});
