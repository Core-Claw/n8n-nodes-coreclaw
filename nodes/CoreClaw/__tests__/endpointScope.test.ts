import type { INodeProperties } from 'n8n-workflow';

import { CoreClaw } from '../CoreClaw.node';
import { workerRunFields } from '../descriptions/WorkerRunDescription';
import { workerTaskFields } from '../descriptions/WorkerTaskDescription';
import { endpointSpecs, excludedEndpointKeys } from '../resources/endpointSpecs';

function fieldNamesFor(fields: INodeProperties[], resource: string, operation: string) {
	return fields
		.filter((field) => {
			const show = field.displayOptions?.show;
			return show?.resource?.includes(resource) && show?.operation?.includes(operation);
		})
		.map((field) => field.name);
}

describe('CoreClaw API v2 endpoint scope', () => {
	it('exposes exactly the 28 allowed API v2 endpoints', () => {
		// Composite operations (run/rerun and get results) reuse existing run
		// endpoints as their trigger — they do not add new API surface. The
		// invariant we guard is the distinct method+path count.
		const distinctEndpoints = new Set(endpointSpecs.map((spec) => `${spec.method} ${spec.path}`));
		expect(distinctEndpoints.size).toBe(28);
	});

	it('registers three composite run-and-get-results operations that reuse trigger endpoints', () => {
		const compositeSpecs = endpointSpecs.filter((spec) => spec.composite === 'runAndGetResults');
		expect(compositeSpecs).toHaveLength(3);

		const baseEndpoints = new Set(
			endpointSpecs
				.filter((spec) => !spec.composite)
				.map((spec) => `${spec.method} ${spec.path}`),
		);

		for (const spec of compositeSpecs) {
			expect(spec.compositeTrigger).toBeDefined();
			// Each composite reuses an existing run/rerun endpoint as its trigger —
			// it must not introduce a new API path.
			const triggerKey = `${spec.compositeTrigger!.method} ${spec.compositeTrigger!.path}`;
			expect(baseEndpoints).toContain(triggerKey);
		}
	});

	it('does not expose worker version or internal endpoints', () => {
		const exposed = new Set(endpointSpecs.map((spec) => `${spec.method} ${spec.path}`));

		for (const endpoint of excludedEndpointKeys) {
			expect(exposed.has(endpoint)).toBe(false);
		}
	});

	it('exposes endpoint operations in the action node UI without excluded operations', () => {
		const node = new CoreClaw();
		const propertiesText = JSON.stringify(node.description.properties);

		expect(propertiesText).toContain('Store Worker');
		expect(propertiesText).toContain('Worker Run');
		expect(propertiesText).toContain('Worker Task');
		expect(propertiesText).toContain('Get Input Schema');
		expect(propertiesText).not.toContain('/versions');
		expect(propertiesText).not.toContain('/internal');
	});

	it('exposes worker_id list filters in description metadata', () => {
		expect(fieldNamesFor(workerRunFields, 'workerRun', 'list')).toContain('worker_id');
		expect(fieldNamesFor(workerTaskFields, 'workerTask', 'list')).toContain('worker_id');
	});
});
