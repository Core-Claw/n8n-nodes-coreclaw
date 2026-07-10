/* eslint-disable @n8n/community-nodes/no-restricted-globals */

interface LiveEnvelope {
	code: number;
	message?: string;
	data?: unknown;
}

const env = process.env;
const baseUrl = env.CORECLAW_BASE_URL || 'https://openapi.coreclaw.com';
const apiKey = env.CORECLAW_API_KEY;
const runLive = env.CORECLAW_LIVE_TESTS === '1' && Boolean(apiKey);

const live = runLive ? describe : describe.skip;

async function request(path: string, init: RequestInit = {}) {
	const response = await fetch(`${baseUrl}${path}`, {
		...init,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'api-key': apiKey!,
			Authorization: `Bearer ${apiKey}`,
			...(init.headers || {}),
		},
	});
	const json = (await response.json()) as LiveEnvelope;
	if (json.code !== 0) {
		throw new Error(`CoreClaw live request failed ${json.code}: ${json.message}`);
	}
	return json.data;
}

live('CoreClaw live API v2 smoke tests', () => {
	it('gets account info', async () => {
		const data = await request('/api/v2/users/account');
		expect(data).toBeDefined();
	});

	it('lists store workers', async () => {
		const data = await request('/api/v2/store?offset=0&limit=1');
		expect(data).toBeDefined();
	});

	it('lists proxy regions', async () => {
		const data = await request('/api/v2/proxy/region?language=en');
		expect(data).toBeDefined();
	});

	it('lists worker runs', async () => {
		const data = await request('/api/v2/worker-runs?offset=0&limit=1');
		expect(data).toBeDefined();
	});

	it('lists worker tasks', async () => {
		const data = await request('/api/v2/worker-tasks?offset=0&limit=1');
		expect(data).toBeDefined();
	});

	it('creates, reads, updates input, and deletes a worker task (input wrapped as parameters.custom)', async () => {
		const created = (await request('/api/v2/worker-tasks', {
			method: 'POST',
			body: JSON.stringify({
				worker_id: 'coreclaw~google-search-scraper',
				title: 'n8n live CRUD test',
				input: { parameters: { custom: { keyword: 'pizza', max_pages: '1' } } },
				schedule_enabled: 0,
			}),
		})) as { slug: string };
		expect(created.slug).toBeTruthy();
		const taskSlug = created.slug;

		try {
			const detail = (await request(`/api/v2/worker-tasks/${taskSlug}`)) as { title: string };
			expect(detail.title).toBe('n8n live CRUD test');

			const fetchedInput = (await request(`/api/v2/worker-tasks/${taskSlug}/input`)) as {
				input: { parameters?: { custom?: { keyword?: string } } };
			};
			expect(fetchedInput.input?.parameters?.custom?.keyword).toBe('pizza');

			await request(`/api/v2/worker-tasks/${taskSlug}/input`, {
				method: 'PUT',
				body: JSON.stringify({
					input: { parameters: { custom: { keyword: 'coffee', max_pages: '1' } } },
				}),
			});
			const updatedInput = (await request(`/api/v2/worker-tasks/${taskSlug}/input`)) as {
				input: { parameters?: { custom?: { keyword?: string } } };
			};
			expect(updatedInput.input?.parameters?.custom?.keyword).toBe('coffee');
		} finally {
			await request(`/api/v2/worker-tasks/${taskSlug}`, { method: 'DELETE' });
		}
	});
});
