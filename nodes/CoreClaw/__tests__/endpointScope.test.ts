import { endpointSpecs, excludedEndpointKeys } from '../resources/endpointSpecs';

describe('CoreClaw API v2 endpoint scope', () => {
	it('exposes exactly the 28 allowed API v2 endpoints', () => {
		expect(endpointSpecs).toHaveLength(28);
		expect(new Set(endpointSpecs.map((spec) => `${spec.method} ${spec.path}`)).size).toBe(28);
	});

	it('does not expose worker version or internal endpoints', () => {
		const exposed = new Set(endpointSpecs.map((spec) => `${spec.method} ${spec.path}`));

		for (const endpoint of excludedEndpointKeys) {
			expect(exposed.has(endpoint)).toBe(false);
		}
	});
});
