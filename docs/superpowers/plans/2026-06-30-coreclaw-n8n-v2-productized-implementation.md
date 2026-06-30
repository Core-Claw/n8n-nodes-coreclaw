# CoreClaw n8n API v2 Productized Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `n8n-nodes-coreclaw` as a productized CoreClaw API v2 n8n package with a 28-operation action node and a callback trigger node.

**Architecture:** Keep one `CoreClaw` action node, add one `CoreClaw Trigger` webhook node, and move API behavior behind shared v2 endpoint specs plus small helper modules. The action node uses generated-looking but hand-owned endpoint metadata, a router, resource descriptions, resource locators, pagination helpers, and a CoreClaw envelope-aware API client.

**Tech Stack:** TypeScript, n8n community node API, `@n8n/node-cli`, Jest, ts-jest, nock, Node.js 20+, CoreClaw API v2.

---

## Current State

The current package has one v1-oriented action node:

- `credentials/CoreClawApi.credentials.ts`
- `nodes/CoreClaw/CoreClaw.node.ts`
- `nodes/CoreClaw/GenericFunctions.ts`
- `nodes/CoreClaw/descriptions/AccountDescription.ts`
- `nodes/CoreClaw/descriptions/RunDescription.ts`
- `nodes/CoreClaw/descriptions/ScraperDescription.ts`
- `nodes/CoreClaw/descriptions/TaskDescription.ts`

The approved design spec is:

- `docs/superpowers/specs/2026-06-30-coreclaw-n8n-v2-productized-design.md`

The package currently lacks Jest tests and only registers one node in `package.json`.

## Target File Structure

Create or modify these files:

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `credentials/CoreClawApi.credentials.ts`
- Modify: `nodes/CoreClaw/CoreClaw.node.ts`
- Modify: `nodes/CoreClaw/CoreClaw.node.json`
- Modify: `nodes/CoreClaw/GenericFunctions.ts`
- Create: `jest.config.js`
- Create: `nodes/CoreClaw/constants.ts`
- Create: `nodes/CoreClaw/types.ts`
- Create: `nodes/CoreClaw/descriptions/ProxyDescription.ts`
- Create: `nodes/CoreClaw/descriptions/StoreWorkerDescription.ts`
- Create: `nodes/CoreClaw/descriptions/WorkerDescription.ts`
- Create: `nodes/CoreClaw/descriptions/WorkerRunDescription.ts`
- Create: `nodes/CoreClaw/descriptions/WorkerTaskDescription.ts`
- Create: `nodes/CoreClaw/resources/endpointSpecs.ts`
- Create: `nodes/CoreClaw/resources/locators.ts`
- Create: `nodes/CoreClaw/resources/pagination.ts`
- Create: `nodes/CoreClaw/resources/router.ts`
- Create: `nodes/CoreClaw/resources/runInput.ts`
- Create: `nodes/CoreClawTrigger/CoreClawTrigger.node.ts`
- Create: `nodes/CoreClawTrigger/CoreClawTrigger.node.json`
- Create: `nodes/CoreClawTrigger/descriptions.ts`
- Create: `nodes/CoreClaw/__tests__/apiClient.test.ts`
- Create: `nodes/CoreClaw/__tests__/endpointScope.test.ts`
- Create: `nodes/CoreClaw/__tests__/runInput.test.ts`
- Create: `nodes/CoreClaw/__tests__/pagination.test.ts`
- Create: `nodes/CoreClaw/__tests__/router.test.ts`
- Create: `nodes/CoreClaw/__tests__/locators.test.ts`
- Create: `nodes/CoreClaw/__tests__/e2e.live.test.ts`
- Create: `nodes/CoreClawTrigger/__tests__/triggerDescription.test.ts`
- Create: `nodes/CoreClawTrigger/__tests__/webhook.test.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

Remove or leave unused only after replacing imports:

- `nodes/CoreClaw/descriptions/ScraperDescription.ts`
- `nodes/CoreClaw/descriptions/RunDescription.ts`
- `nodes/CoreClaw/descriptions/TaskDescription.ts`

---

## Task 1: Add Test Infrastructure

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `jest.config.js`

- [ ] **Step 1: Write the test config**

Create `jest.config.js`:

```js
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/__tests__/**/*.test.ts'],
	clearMocks: true,
};
```

- [ ] **Step 2: Add test dependencies and scripts**

Run:

```powershell
npm install --save-dev jest ts-jest @types/jest nock
```

Then update `package.json` scripts:

```json
{
	"test": "jest --config jest.config.js",
	"test:live": "set CORECLAW_LIVE_TESTS=1&& jest --config jest.config.js nodes/CoreClaw/__tests__/e2e.live.test.ts"
}
```

Keep existing scripts intact.

- [ ] **Step 3: Verify empty test runner behavior**

Run:

```powershell
npm test -- --passWithNoTests
```

Expected: exit code `0`.

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json jest.config.js
git commit -m "test: add jest infrastructure"
```

---

## Task 2: Define Core v2 Types and Constants

**Files:**
- Create: `nodes/CoreClaw/constants.ts`
- Create: `nodes/CoreClaw/types.ts`
- Test: `nodes/CoreClaw/__tests__/endpointScope.test.ts`

- [ ] **Step 1: Write the failing endpoint scope test**

Create `nodes/CoreClaw/__tests__/endpointScope.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/endpointScope.test.ts
```

Expected: FAIL because `../resources/endpointSpecs` does not exist.

- [ ] **Step 3: Create shared constants**

Create `nodes/CoreClaw/constants.ts`:

```ts
export const CORECLAW_DEFAULT_BASE_URL = 'https://openapi.coreclaw.com';

export const CORECLAW_DEFAULT_TIMEOUT_MS = 60_000;

export const CORECLAW_RESULT_LIMIT_MAX = 100;

export const CORECLAW_TERMINAL_RUN_STATUSES = [
	'succeeded',
	'failed',
	'aborted',
	'aborting',
] as const;

export const CORECLAW_ERROR_HINTS: Record<number, string> = {
	10000: 'Internal server error: retry later or contact CoreClaw support with the request ID.',
	11000: 'Invalid request parameters: check required fields, JSON input, offset, limit, and IDs.',
	11004: 'Resource not found: verify the worker ID, run ID, or worker task ID.',
	12001: 'Authentication required: verify the CoreClaw API key credential.',
	12002: 'Invalid token: generate or paste a valid CoreClaw API key.',
	13000: 'Rate limited: wait and retry.',
	14000: 'Database error: retry later or contact CoreClaw support with the request ID.',
	30001: 'Insufficient balance: top up the CoreClaw account before running workers.',
	50001: 'Worker not found: verify the worker ID or owner path.',
	50002: 'Worker run failed: inspect run logs and validate input against the worker input schema.',
	50003: 'Worker version unavailable: use a valid version or omit version for the backend default.',
	60001: 'Task not found: verify the worker task ID.',
	70001: 'Run not found: verify the run ID.',
	70002: 'Run operation failed: inspect run status and logs.',
	16000: 'Not implemented: this CoreClaw API feature is unavailable.',
};
```

- [ ] **Step 4: Create shared types**

Create `nodes/CoreClaw/types.ts`:

```ts
import type { IDataObject, IHttpRequestMethods } from 'n8n-workflow';

export type CoreClawResource =
	| 'storeWorker'
	| 'worker'
	| 'workerRun'
	| 'workerTask'
	| 'proxy'
	| 'account';

export type CoreClawParamLocation = 'path' | 'query' | 'body';

export type CoreClawParamType = 'string' | 'number' | 'boolean' | 'json';

export interface CoreClawParamSpec {
	name: string;
	displayName: string;
	location: CoreClawParamLocation;
	type: CoreClawParamType;
	required?: boolean;
	default?: string | number | boolean;
	options?: Array<{ name: string; value: string | number | boolean; description?: string }>;
	description: string;
}

export interface CoreClawEndpointSpec {
	resource: CoreClawResource;
	operation: string;
	displayName: string;
	action: string;
	method: IHttpRequestMethods;
	path: string;
	auth: boolean;
	params: CoreClawParamSpec[];
	returnsList?: boolean;
	supportsReturnAll?: boolean;
	supportsWaitForFinish?: boolean;
}

export interface CoreClawEnvelope {
	code: number;
	message?: string;
	data?: unknown;
	request_id?: string;
	details?: string[] | null;
}

export interface CoreClawRequestArgs {
	method: IHttpRequestMethods;
	path: string;
	body?: IDataObject;
	qs?: IDataObject;
	retrySafe?: boolean;
}
```

- [ ] **Step 5: Run the test again**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/endpointScope.test.ts
```

Expected: still FAIL because `endpointSpecs.ts` does not exist.

- [ ] **Step 6: Commit**

```powershell
git add nodes/CoreClaw/constants.ts nodes/CoreClaw/types.ts nodes/CoreClaw/__tests__/endpointScope.test.ts
git commit -m "feat: add CoreClaw v2 shared types"
```

---

## Task 3: Add the 28 Endpoint Specs

**Files:**
- Create: `nodes/CoreClaw/resources/endpointSpecs.ts`
- Test: `nodes/CoreClaw/__tests__/endpointScope.test.ts`

- [ ] **Step 1: Implement endpoint specs**

Create `nodes/CoreClaw/resources/endpointSpecs.ts`:

```ts
import type { CoreClawEndpointSpec, CoreClawParamSpec } from '../types';

const offsetParam = (): CoreClawParamSpec => ({
	name: 'offset',
	displayName: 'Offset',
	location: 'query',
	type: 'number',
	default: 0,
	description: 'Result offset. Must be 0 or greater.',
});

const limitParam = (): CoreClawParamSpec => ({
	name: 'limit',
	displayName: 'Limit',
	location: 'query',
	type: 'number',
	default: 20,
	description: 'Result limit. Must be between 1 and 100.',
});

const bodyOffsetParam = (): CoreClawParamSpec => ({ ...offsetParam(), location: 'body' });

const bodyLimitParam = (): CoreClawParamSpec => ({ ...limitParam(), location: 'body' });

const keywordParam = (description: string): CoreClawParamSpec => ({
	name: 'keyword',
	displayName: 'Keyword',
	location: 'query',
	type: 'string',
	description,
});

const workerIdPathParam = (): CoreClawParamSpec => ({
	name: 'workerId',
	displayName: 'Worker ID',
	location: 'path',
	type: 'string',
	required: true,
	description: 'Worker slug or owner path, such as demo-worker or owner~demo-worker.',
});

const runIdPathParam = (): CoreClawParamSpec => ({
	name: 'runId',
	displayName: 'Run ID',
	location: 'path',
	type: 'string',
	required: true,
	description: 'Worker run identifier returned by run or list operations.',
});

const workerTaskIdPathParam = (): CoreClawParamSpec => ({
	name: 'workerTaskId',
	displayName: 'Worker Task ID',
	location: 'path',
	type: 'string',
	required: true,
	description: 'Saved worker task identifier returned by the list worker tasks operation.',
});

const isAsyncParam = (): CoreClawParamSpec => ({
	name: 'is_async',
	displayName: 'Run Asynchronously',
	location: 'body',
	type: 'boolean',
	default: true,
	description: 'Whether CoreClaw should run asynchronously.',
});

const callbackUrlParam = (): CoreClawParamSpec => ({
	name: 'callback_url',
	displayName: 'Callback URL',
	location: 'body',
	type: 'string',
	description: 'Optional URL CoreClaw calls with run status updates.',
});

const formatParam = (): CoreClawParamSpec => ({
	name: 'format',
	displayName: 'Format',
	location: 'query',
	type: 'string',
	default: 'csv',
	options: [
		{ name: 'CSV', value: 'csv' },
		{ name: 'JSON', value: 'json' },
	],
	description: 'Export file format.',
});

const filterKeysParam = (): CoreClawParamSpec => ({
	name: 'filter_keys',
	displayName: 'Filter Keys',
	location: 'query',
	type: 'string',
	description: 'Comma-separated field keys to export. Leave empty to include all fields.',
});

const runBodyParams = (): CoreClawParamSpec[] => [
	callbackUrlParam(),
	isAsyncParam(),
	bodyOffsetParam(),
	bodyLimitParam(),
];

export const excludedEndpointKeys = [
	'POST /api/v2/workers/{workerId}/versions',
	'PUT /api/v2/workers/{workerId}/versions/{version}',
	'GET /api/v2/workers/{workerId}/internal',
] as const;

export const endpointSpecs: CoreClawEndpointSpec[] = [
	{
		resource: 'proxy',
		operation: 'listRegions',
		displayName: 'List Regions',
		action: 'List proxy regions',
		method: 'GET',
		path: '/api/v2/proxy/region',
		auth: false,
		returnsList: true,
		params: [
			{
				name: 'language',
				displayName: 'Language',
				location: 'query',
				type: 'string',
				default: 'en',
				options: [
					{ name: 'English', value: 'en' },
					{ name: 'Chinese', value: 'zh' },
				],
				description: 'Region display language.',
			},
		],
	},
	{
		resource: 'storeWorker',
		operation: 'list',
		displayName: 'List',
		action: 'List store workers',
		method: 'GET',
		path: '/api/v2/store',
		auth: false,
		returnsList: true,
		supportsReturnAll: true,
		params: [offsetParam(), limitParam(), keywordParam('Keyword for title, slug, or path.')],
	},
	{
		resource: 'account',
		operation: 'getInfo',
		displayName: 'Get Info',
		action: 'Get account info',
		method: 'GET',
		path: '/api/v2/users/account',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'list',
		displayName: 'List',
		action: 'List worker runs',
		method: 'GET',
		path: '/api/v2/worker-runs',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [
			offsetParam(),
			limitParam(),
			{
				name: 'worker_id',
				displayName: 'Worker ID',
				location: 'query',
				type: 'string',
				description: 'Filter by worker slug or owner path.',
			},
			{
				name: 'status',
				displayName: 'Status',
				location: 'query',
				type: 'string',
				options: [
					{ name: 'Ready', value: 'ready' },
					{ name: 'Running', value: 'running' },
					{ name: 'Succeeded', value: 'succeeded' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Aborting', value: 'aborting' },
				],
				description: 'Filter by run status.',
			},
		],
	},
	{
		resource: 'workerRun',
		operation: 'getLast',
		displayName: 'Get Last',
		action: 'Get last worker run',
		method: 'GET',
		path: '/api/v2/worker-runs/last',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'abortLast',
		displayName: 'Abort Last',
		action: 'Abort last worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/last/abort',
		auth: true,
		params: runBodyParams(),
	},
	{
		resource: 'workerRun',
		operation: 'exportLastResults',
		displayName: 'Export Last Results',
		action: 'Export last worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/last/export',
		auth: true,
		params: [formatParam(), filterKeysParam()],
	},
	{
		resource: 'workerRun',
		operation: 'getLastLog',
		displayName: 'Get Last Log',
		action: 'Get last worker run log',
		method: 'GET',
		path: '/api/v2/worker-runs/last/log',
		auth: true,
		params: [],
	},
	{
		resource: 'workerRun',
		operation: 'rerunLast',
		displayName: 'Rerun Last',
		action: 'Rerun last worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/last/rerun',
		auth: true,
		supportsWaitForFinish: true,
		params: runBodyParams(),
	},
	{
		resource: 'workerRun',
		operation: 'listLastResults',
		displayName: 'List Last Results',
		action: 'List last worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/last/result',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [offsetParam(), limitParam()],
	},
	{
		resource: 'workerRun',
		operation: 'get',
		displayName: 'Get',
		action: 'Get worker run',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}',
		auth: true,
		params: [runIdPathParam()],
	},
	{
		resource: 'workerRun',
		operation: 'abort',
		displayName: 'Abort',
		action: 'Abort worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/{runId}/abort',
		auth: true,
		params: [runIdPathParam()],
	},
	{
		resource: 'workerRun',
		operation: 'getLog',
		displayName: 'Get Log',
		action: 'Get worker run log',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}/log',
		auth: true,
		params: [runIdPathParam()],
	},
	{
		resource: 'workerRun',
		operation: 'rerun',
		displayName: 'Rerun',
		action: 'Rerun worker run',
		method: 'POST',
		path: '/api/v2/worker-runs/{runId}/rerun',
		auth: true,
		supportsWaitForFinish: true,
		params: [runIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'workerRun',
		operation: 'listResults',
		displayName: 'List Results',
		action: 'List worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}/result',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [runIdPathParam(), offsetParam(), limitParam()],
	},
	{
		resource: 'workerRun',
		operation: 'exportResults',
		displayName: 'Export Results',
		action: 'Export worker run results',
		method: 'GET',
		path: '/api/v2/worker-runs/{runId}/result/export',
		auth: true,
		params: [runIdPathParam(), formatParam(), filterKeysParam()],
	},
	{
		resource: 'workerTask',
		operation: 'list',
		displayName: 'List',
		action: 'List worker tasks',
		method: 'GET',
		path: '/api/v2/worker-tasks',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [
			offsetParam(),
			limitParam(),
			{
				name: 'worker_id',
				displayName: 'Worker ID',
				location: 'query',
				type: 'string',
				description: 'Filter by worker slug or owner path.',
			},
			keywordParam('Keyword for task title or slug.'),
		],
	},
	{
		resource: 'workerTask',
		operation: 'run',
		displayName: 'Run',
		action: 'Run worker task',
		method: 'POST',
		path: '/api/v2/worker-tasks/{workerTaskId}/runs',
		auth: true,
		supportsWaitForFinish: true,
		params: [workerTaskIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'worker',
		operation: 'list',
		displayName: 'List',
		action: 'List workers',
		method: 'GET',
		path: '/api/v2/workers',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [offsetParam(), limitParam(), keywordParam('Keyword for title, slug, or path.')],
	},
	{
		resource: 'worker',
		operation: 'get',
		displayName: 'Get',
		action: 'Get worker',
		method: 'GET',
		path: '/api/v2/workers/{workerId}',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'getInputSchema',
		displayName: 'Get Input Schema',
		action: 'Get worker input schema',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/input-schema',
		auth: false,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'run',
		displayName: 'Run',
		action: 'Run worker',
		method: 'POST',
		path: '/api/v2/workers/{workerId}/runs',
		auth: true,
		supportsWaitForFinish: true,
		params: [
			workerIdPathParam(),
			{
				name: 'version',
				displayName: 'Version',
				location: 'body',
				type: 'string',
				description: 'Worker script version. Leave empty to use backend default.',
			},
			{
				name: 'input_json',
				displayName: 'Input JSON',
				location: 'body',
				type: 'json',
				description: 'Worker business input JSON. Wrapped as input.parameters.custom.',
			},
			{
				name: 'raw_input_json',
				displayName: 'Raw Input JSON',
				location: 'body',
				type: 'json',
				description: 'Advanced full CoreClaw input object. Do not combine with Input JSON.',
			},
			...runBodyParams(),
		],
	},
	{
		resource: 'worker',
		operation: 'getLastRun',
		displayName: 'Get Last Run',
		action: 'Get worker last run',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'abortLastRun',
		displayName: 'Abort Last Run',
		action: 'Abort worker last run',
		method: 'POST',
		path: '/api/v2/workers/{workerId}/runs/last/abort',
		auth: true,
		params: [workerIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'worker',
		operation: 'exportLastRunResults',
		displayName: 'Export Last Run Results',
		action: 'Export worker last run results',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last/export',
		auth: true,
		params: [workerIdPathParam(), formatParam(), filterKeysParam()],
	},
	{
		resource: 'worker',
		operation: 'getLastRunLog',
		displayName: 'Get Last Run Log',
		action: 'Get worker last run log',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last/log',
		auth: true,
		params: [workerIdPathParam()],
	},
	{
		resource: 'worker',
		operation: 'rerunLastRun',
		displayName: 'Rerun Last Run',
		action: 'Rerun worker last run',
		method: 'POST',
		path: '/api/v2/workers/{workerId}/runs/last/rerun',
		auth: true,
		supportsWaitForFinish: true,
		params: [workerIdPathParam(), ...runBodyParams()],
	},
	{
		resource: 'worker',
		operation: 'listLastRunResults',
		displayName: 'List Last Run Results',
		action: 'List worker last run results',
		method: 'GET',
		path: '/api/v2/workers/{workerId}/runs/last/result',
		auth: true,
		returnsList: true,
		supportsReturnAll: true,
		params: [workerIdPathParam(), offsetParam(), limitParam()],
	},
];

export function getEndpointSpec(resource: string, operation: string) {
	return endpointSpecs.find((spec) => spec.resource === resource && spec.operation === operation);
}
```

- [ ] **Step 2: Run the endpoint scope test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/endpointScope.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add nodes/CoreClaw/resources/endpointSpecs.ts nodes/CoreClaw/__tests__/endpointScope.test.ts
git commit -m "feat: define CoreClaw v2 endpoint specs"
```

---

## Task 4: Implement Run Input Preparation

**Files:**
- Create: `nodes/CoreClaw/resources/runInput.ts`
- Test: `nodes/CoreClaw/__tests__/runInput.test.ts`

- [ ] **Step 1: Write failing tests**

Create `nodes/CoreClaw/__tests__/runInput.test.ts`:

```ts
import { prepareRunWorkerBody } from '../resources/runInput';

describe('prepareRunWorkerBody', () => {
	it('wraps input_json as input.parameters.custom', () => {
		expect(
			prepareRunWorkerBody({
				input_json: { keyword: 'coffee', limit: 2 },
			}),
		).toEqual({
			input: {
				parameters: {
					custom: { keyword: 'coffee', limit: 2 },
				},
			},
		});
	});

	it('passes raw_input_json through as input', () => {
		expect(
			prepareRunWorkerBody({
				raw_input_json: {
					parameters: {
						system: { proxy_region: 'US' },
						custom: { keyword: 'coffee' },
					},
				},
			}),
		).toEqual({
			input: {
				parameters: {
					system: { proxy_region: 'US' },
					custom: { keyword: 'coffee' },
				},
			},
		});
	});

	it('rejects input_json and raw_input_json together', () => {
		expect(() =>
			prepareRunWorkerBody({
				input_json: { keyword: 'coffee' },
				raw_input_json: { parameters: { custom: { keyword: 'tea' } } },
			}),
		).toThrow('Use either Input JSON or Raw Input JSON, not both');
	});

	it('keeps normal run body fields and drops empty values', () => {
		expect(
			prepareRunWorkerBody({
				version: '',
				callback_url: 'https://n8n.example/webhook/coreclaw',
				is_async: true,
				offset: 0,
				limit: 20,
			}),
		).toEqual({
			callback_url: 'https://n8n.example/webhook/coreclaw',
			is_async: true,
			offset: 0,
			limit: 20,
		});
	});
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/runInput.test.ts
```

Expected: FAIL because `runInput.ts` does not exist.

- [ ] **Step 3: Implement run input helper**

Create `nodes/CoreClaw/resources/runInput.ts`:

```ts
import type { IDataObject } from 'n8n-workflow';

export function compactBody(body: IDataObject): IDataObject {
	const compacted: IDataObject = {};

	for (const [key, value] of Object.entries(body)) {
		if (value === undefined || value === null || value === '') continue;
		compacted[key] = value as IDataObject[string];
	}

	return compacted;
}

export function prepareRunWorkerBody(body: IDataObject): IDataObject {
	const prepared = compactBody({ ...body });
	const hasInputJson = prepared.input_json !== undefined;
	const hasRawInputJson = prepared.raw_input_json !== undefined;

	if (hasInputJson && hasRawInputJson) {
		throw new Error('Use either Input JSON or Raw Input JSON, not both');
	}

	if (hasRawInputJson) {
		prepared.input = prepared.raw_input_json;
		delete prepared.raw_input_json;
	}

	if (hasInputJson) {
		prepared.input = wrapWorkerCustomInput(prepared.input_json);
		delete prepared.input_json;
	}

	return prepared;
}

export function wrapWorkerCustomInput(input: unknown): IDataObject {
	if (input && typeof input === 'object' && !Array.isArray(input) && 'parameters' in input) {
		return input as IDataObject;
	}

	return {
		parameters: {
			custom: input,
		},
	};
}
```

- [ ] **Step 4: Run the test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/runInput.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add nodes/CoreClaw/resources/runInput.ts nodes/CoreClaw/__tests__/runInput.test.ts
git commit -m "feat: prepare CoreClaw worker run input"
```

---

## Task 5: Implement Pagination Helpers

**Files:**
- Create: `nodes/CoreClaw/resources/pagination.ts`
- Test: `nodes/CoreClaw/__tests__/pagination.test.ts`

- [ ] **Step 1: Write failing tests**

Create `nodes/CoreClaw/__tests__/pagination.test.ts`:

```ts
import { extractItems, nextOffset } from '../resources/pagination';

describe('pagination helpers', () => {
	it.each(['items', 'records', 'list', 'results'])('extracts arrays from %s', (key) => {
		expect(extractItems({ [key]: [{ id: 1 }] })).toEqual([{ id: 1 }]);
	});

	it('uses data when data is an array', () => {
		expect(extractItems({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
	});

	it('returns undefined for ambiguous objects', () => {
		expect(extractItems({ id: 1, title: 'single object' })).toBeUndefined();
	});

	it('increments offset by fetched row count', () => {
		expect(nextOffset(20, [{}, {}, {}])).toBe(23);
	});
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/pagination.test.ts
```

Expected: FAIL because `pagination.ts` does not exist.

- [ ] **Step 3: Implement pagination helper**

Create `nodes/CoreClaw/resources/pagination.ts`:

```ts
import type { IDataObject } from 'n8n-workflow';

const LIST_KEYS = ['items', 'records', 'list', 'data', 'results'] as const;

export function extractItems(data: unknown): IDataObject[] | undefined {
	if (Array.isArray(data)) return data as IDataObject[];
	if (!data || typeof data !== 'object') return undefined;

	const object = data as IDataObject;

	for (const key of LIST_KEYS) {
		const value = object[key];
		if (Array.isArray(value)) return value as IDataObject[];
	}

	return undefined;
}

export function nextOffset(currentOffset: number, rows: IDataObject[]): number {
	return currentOffset + rows.length;
}
```

- [ ] **Step 4: Run the test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/pagination.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add nodes/CoreClaw/resources/pagination.ts nodes/CoreClaw/__tests__/pagination.test.ts
git commit -m "feat: add CoreClaw pagination helpers"
```

---

## Task 6: Rewrite the CoreClaw API Client

**Files:**
- Modify: `nodes/CoreClaw/GenericFunctions.ts`
- Test: `nodes/CoreClaw/__tests__/apiClient.test.ts`

- [ ] **Step 1: Write API client tests**

Create `nodes/CoreClaw/__tests__/apiClient.test.ts` with mocked n8n execution context:

```ts
import { coreClawApiRequest, parseJsonParameter } from '../GenericFunctions';

function createContext(response: unknown, credentials = {}) {
	return {
		getNode: () => ({ name: 'CoreClaw', type: 'n8n-nodes-coreclaw.coreClaw' }),
		getCredentials: jest.fn().mockResolvedValue({
			apiKey: 'test-key',
			baseUrl: 'https://openapi.coreclaw.com/',
			...credentials,
		}),
		helpers: {
			httpRequestWithAuthentication: jest.fn().mockResolvedValue(response),
		},
	} as any;
}

describe('coreClawApiRequest', () => {
	it('unwraps successful CoreClaw envelopes', async () => {
		const context = createContext({ code: 0, message: 'success', data: { ok: true } });

		await expect(coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' })).resolves.toEqual({ ok: true });
	});

	it('throws on CoreClaw non-zero code', async () => {
		const context = createContext({
			code: 12001,
			message: 'authentication required',
			request_id: 'req-1',
			details: ['bad token'],
		});

		await expect(coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' })).rejects.toThrow('CoreClaw error 12001');
	});

	it('throws on missing envelope code', async () => {
		const context = createContext({ ok: true });

		await expect(coreClawApiRequest.call(context, { method: 'GET', path: '/api/v2/users/account' })).rejects.toThrow('Unexpected CoreClaw response shape');
	});
});

describe('parseJsonParameter', () => {
	it('accepts object values', () => {
		const context = { getNode: () => ({ name: 'CoreClaw' }) } as any;
		expect(parseJsonParameter.call(context, { keyword: 'coffee' }, 'Input JSON', 0)).toEqual({
			keyword: 'coffee',
		});
	});

	it('parses JSON strings', () => {
		const context = { getNode: () => ({ name: 'CoreClaw' }) } as any;
		expect(parseJsonParameter.call(context, '{"keyword":"coffee"}', 'Input JSON', 0)).toEqual({
			keyword: 'coffee',
		});
	});
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/apiClient.test.ts
```

Expected: FAIL because current `coreClawApiRequest` has the old positional signature and old v1 assumptions.

- [ ] **Step 3: Replace `GenericFunctions.ts`**

Implement `nodes/CoreClaw/GenericFunctions.ts` with:

```ts
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

import { CORECLAW_DEFAULT_BASE_URL, CORECLAW_DEFAULT_TIMEOUT_MS, CORECLAW_ERROR_HINTS } from './constants';
import type { CoreClawEnvelope, CoreClawRequestArgs } from './types';

type CoreClawContext = IExecuteFunctions | ILoadOptionsFunctions;

export async function coreClawApiRequest(
	this: CoreClawContext,
	args: CoreClawRequestArgs,
): Promise<unknown> {
	const credentials = await this.getCredentials('coreClawApi');
	const baseUrl = String(credentials.baseUrl || CORECLAW_DEFAULT_BASE_URL).replace(/\/$/, '');
	const apiKey = String(credentials.apiKey || '');

	const options: IHttpRequestOptions = {
		method: args.method,
		url: `${baseUrl}${args.path}`,
		json: true,
		timeout: CORECLAW_DEFAULT_TIMEOUT_MS,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'api-key': apiKey,
			Authorization: `Bearer ${apiKey}`,
		},
	};

	if (args.qs && Object.keys(args.qs).length > 0) options.qs = args.qs;
	if (args.body && Object.keys(args.body).length > 0) options.body = args.body;

	const execute = async () =>
		this.helpers.httpRequestWithAuthentication.call(this, 'coreClawApi', options) as Promise<CoreClawEnvelope>;

	let response: CoreClawEnvelope;
	try {
		response = args.retrySafe ? await retryRead(execute) : await execute();
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'CoreClaw request failed',
			description: (error as Error).message,
		});
	}

	return unwrapCoreClawEnvelope.call(this, response);
}

export function unwrapCoreClawEnvelope(this: CoreClawContext, response: CoreClawEnvelope): unknown {
	if (!response || typeof response.code !== 'number') {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: 'Unexpected CoreClaw response shape',
			description: 'Response did not contain a numeric code field.',
		});
	}

	if (response.code !== 0) {
		const hint = CORECLAW_ERROR_HINTS[response.code];
		const details = Array.isArray(response.details) ? response.details.join('; ') : '';
		const description = [response.message, hint, details, response.request_id ? `request_id: ${response.request_id}` : '']
			.filter(Boolean)
			.join(' | ');

		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: `CoreClaw error ${response.code}`,
			description,
			httpCode: String(response.code),
		});
	}

	return response.data;
}

async function retryRead<T>(fn: () => Promise<T>): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			const status = Number((error as { httpCode?: number | string }).httpCode);
			const retryable = Number.isNaN(status) || status === 429 || status >= 500;
			if (!retryable || attempt === 4) break;
			await sleep(1000 * Math.pow(2, attempt));
		}
	}

	throw lastError;
}

export function parseJsonParameter(
	this: IExecuteFunctions,
	value: unknown,
	fieldName: string,
	itemIndex: number,
): IDataObject | unknown[] | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'object') return value as IDataObject | unknown[];

	if (typeof value !== 'string') {
		throw new NodeOperationError(this.getNode(), `${fieldName} must be a JSON object`, { itemIndex });
	}

	const trimmed = value.trim();
	if (!trimmed) return undefined;

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch (error) {
		throw new NodeOperationError(this.getNode(), `${fieldName} is not valid JSON: ${(error as Error).message}`, {
			itemIndex,
		});
	}

	if (parsed === null || typeof parsed !== 'object') {
		throw new NodeOperationError(this.getNode(), `${fieldName} must parse to a JSON object or array`, { itemIndex });
	}

	return parsed as IDataObject | unknown[];
}

export function splitCsv(value: string): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
}
```

- [ ] **Step 4: Run API client tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/apiClient.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add nodes/CoreClaw/GenericFunctions.ts nodes/CoreClaw/__tests__/apiClient.test.ts
git commit -m "feat: add CoreClaw v2 API client"
```

---

## Task 7: Implement Resource Locators

**Files:**
- Create: `nodes/CoreClaw/resources/locators.ts`
- Test: `nodes/CoreClaw/__tests__/locators.test.ts`

- [ ] **Step 1: Write locator tests**

Create `nodes/CoreClaw/__tests__/locators.test.ts`:

```ts
import { formatRunOption, formatWorkerOption, normalizeList } from '../resources/locators';

describe('resource locator helpers', () => {
	it('normalizes common list response shapes', () => {
		expect(normalizeList({ items: [{ slug: 'a' }] })).toEqual([{ slug: 'a' }]);
		expect(normalizeList({ records: [{ slug: 'b' }] })).toEqual([{ slug: 'b' }]);
		expect(normalizeList([{ slug: 'c' }])).toEqual([{ slug: 'c' }]);
	});

	it('formats worker options with useful names', () => {
		expect(formatWorkerOption({ title: 'Demo Worker', path: 'demo~worker', description: 'Demo' })).toEqual({
			name: 'Demo Worker (demo~worker)',
			value: 'demo~worker',
			description: 'Demo',
			url: 'https://coreclaw.com/store/demo~worker',
		});
	});

	it('formats run options with status', () => {
		expect(formatRunOption({ run_id: 'run-1', run_status: 'succeeded', worker_id: 'demo' })).toEqual({
			name: 'run-1 (succeeded)',
			value: 'run-1',
			description: 'demo',
		});
	});
});
```

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/locators.test.ts
```

Expected: FAIL because `locators.ts` does not exist.

- [ ] **Step 3: Implement locator helpers**

Create `nodes/CoreClaw/resources/locators.ts`:

```ts
import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { coreClawApiRequest } from '../GenericFunctions';
import { extractItems } from './pagination';

export function normalizeList(data: unknown): IDataObject[] {
	return extractItems(data) ?? [];
}

export function formatWorkerOption(worker: IDataObject) {
	const value = String(worker.path || worker.slug || worker.worker_id || worker.id || '');
	const title = String(worker.title || worker.name || value || '(unnamed worker)');
	const description = worker.description ? String(worker.description) : undefined;

	return {
		name: value && title !== value ? `${title} (${value})` : title,
		value,
		description,
		url: value ? `https://coreclaw.com/store/${value}` : undefined,
	};
}

export function formatWorkerTaskOption(task: IDataObject) {
	const value = String(task.worker_task_id || task.task_id || task.slug || task.id || '');
	const title = String(task.title || task.name || value || '(unnamed task)');
	const description = task.worker_id ? String(task.worker_id) : undefined;

	return {
		name: value && title !== value ? `${title} (${value})` : title,
		value,
		description,
	};
}

export function formatRunOption(run: IDataObject) {
	const value = String(run.run_id || run.run_slug || run.id || '');
	const status = String(run.run_status || run.status || 'unknown');
	const worker = String(run.worker_id || run.worker_slug || run.worker_name || '');

	return {
		name: value ? `${value} (${status})` : `(unknown run) (${status})`,
		value,
		description: worker || undefined,
	};
}

export const locatorMethods = {
	async searchStoreWorkers(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/store',
			qs: { keyword: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatWorkerOption).filter((option) => option.value) };
	},

	async searchWorkers(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/workers',
			qs: { keyword: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatWorkerOption).filter((option) => option.value) };
	},

	async searchWorkerTasks(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/worker-tasks',
			qs: { keyword: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatWorkerTaskOption).filter((option) => option.value) };
	},

	async searchWorkerRuns(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/worker-runs',
			qs: { worker_id: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatRunOption).filter((option) => option.value) };
	},
};
```

- [ ] **Step 4: Run locator tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/locators.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add nodes/CoreClaw/resources/locators.ts nodes/CoreClaw/__tests__/locators.test.ts
git commit -m "feat: add CoreClaw resource locators"
```

---

## Task 8: Build Action Node Descriptions

**Files:**
- Create: `nodes/CoreClaw/descriptions/ProxyDescription.ts`
- Create: `nodes/CoreClaw/descriptions/StoreWorkerDescription.ts`
- Create: `nodes/CoreClaw/descriptions/WorkerDescription.ts`
- Create: `nodes/CoreClaw/descriptions/WorkerRunDescription.ts`
- Create: `nodes/CoreClaw/descriptions/WorkerTaskDescription.ts`
- Modify: `nodes/CoreClaw/descriptions/AccountDescription.ts`
- Test: `nodes/CoreClaw/__tests__/endpointScope.test.ts`

- [ ] **Step 1: Extend endpoint scope tests for UI coverage**

Add this test to `nodes/CoreClaw/__tests__/endpointScope.test.ts`:

```ts
import { CoreClaw } from '../CoreClaw.node';

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
```

- [ ] **Step 2: Run failing UI coverage test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/endpointScope.test.ts
```

Expected: FAIL because `CoreClaw.node.ts` still imports old v1 descriptions.

- [ ] **Step 3: Create description modules**

Each description module exports arrays of `INodeProperties`.

Required operation values:

```ts
// StoreWorkerDescription.ts
export const storeWorkerOperations = [{ displayName: 'Operation', name: 'operation', ... }];
export const storeWorkerFields = [];

// ProxyDescription.ts
export const proxyOperations = [...];
export const proxyFields = [...language field...];

// WorkerDescription.ts
operations: list, get, getInputSchema, run, getLastRun, abortLastRun, exportLastRunResults, getLastRunLog, rerunLastRun, listLastRunResults

// WorkerRunDescription.ts
operations: list, getLast, abortLast, exportLastResults, getLastLog, rerunLast, listLastResults, get, abort, getLog, rerun, listResults, exportResults

// WorkerTaskDescription.ts
operations: list, run

// AccountDescription.ts
operation: getInfo
```

Use field names from `endpointSpecs.ts`: `workerId`, `runId`, `workerTaskId`, `keyword`, `offset`, `limit`, `returnAll`, `status`, `format`, `filter_keys`, `input_json`, `raw_input_json`, `version`, `callback_url`, `is_async`, `waitForFinish`.

Resource locator fields:

```ts
{
	displayName: 'Worker ID',
	name: 'workerId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From Store',
			name: 'list',
			type: 'list',
			typeOptions: { searchListMethod: 'searchStoreWorkers', searchable: true },
		},
		{
			displayName: 'From My Workers',
			name: 'owned',
			type: 'list',
			typeOptions: { searchListMethod: 'searchWorkers', searchable: true },
		},
		{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'owner~demo-worker' },
	],
}
```

Keep field descriptions direct and API-v2-specific.

- [ ] **Step 4: Run UI coverage test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/endpointScope.test.ts
```

Expected: still FAIL until `CoreClaw.node.ts` is updated in Task 10.

- [ ] **Step 5: Commit description modules**

```powershell
git add nodes/CoreClaw/descriptions
git commit -m "feat: add CoreClaw v2 node descriptions"
```

---

## Task 9: Implement Action Router

**Files:**
- Create: `nodes/CoreClaw/resources/router.ts`
- Test: `nodes/CoreClaw/__tests__/router.test.ts`

- [ ] **Step 1: Write router tests**

Create `nodes/CoreClaw/__tests__/router.test.ts`:

```ts
import { buildRequestFromSpec, replacePathParams } from '../resources/router';
import { getEndpointSpec } from '../resources/endpointSpecs';

describe('router request building', () => {
	it('replaces path parameters using encoded values', () => {
		expect(replacePathParams('/api/v2/workers/{workerId}', { workerId: 'owner~demo worker' })).toBe(
			'/api/v2/workers/owner~demo%20worker',
		);
	});

	it('maps GET params to query string', () => {
		const spec = getEndpointSpec('workerRun', 'list');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			offset: 0,
			limit: 20,
			status: 'succeeded',
			worker_id: 'demo',
		});

		expect(request).toMatchObject({
			method: 'GET',
			path: '/api/v2/worker-runs',
			qs: { offset: 0, limit: 20, status: 'succeeded', worker_id: 'demo' },
		});
	});

	it('maps POST params to body and path', () => {
		const spec = getEndpointSpec('worker', 'run');
		expect(spec).toBeDefined();

		const request = buildRequestFromSpec(spec!, {
			workerId: 'demo',
			input_json: { keyword: 'coffee' },
			is_async: true,
		});

		expect(request.path).toBe('/api/v2/workers/demo/runs');
		expect(request.body).toEqual({
			input: { parameters: { custom: { keyword: 'coffee' } } },
			is_async: true,
		});
	});
});
```

- [ ] **Step 2: Run failing router tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/router.test.ts
```

Expected: FAIL because `router.ts` does not exist.

- [ ] **Step 3: Implement router**

Create `nodes/CoreClaw/resources/router.ts`:

```ts
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { coreClawApiRequest, parseJsonParameter } from '../GenericFunctions';
import type { CoreClawEndpointSpec, CoreClawParamSpec, CoreClawRequestArgs } from '../types';
import { getEndpointSpec } from './endpointSpecs';
import { extractItems, nextOffset } from './pagination';
import { prepareRunWorkerBody, compactBody } from './runInput';

export function replacePathParams(path: string, params: IDataObject): string {
	return path.replace(/\{([^}]+)\}/g, (_, name: string) => encodeURIComponent(String(params[name] ?? '')));
}

export function buildRequestFromSpec(spec: CoreClawEndpointSpec, params: IDataObject): CoreClawRequestArgs {
	const pathParams: IDataObject = {};
	const qs: IDataObject = {};
	const body: IDataObject = {};

	for (const param of spec.params) {
		const value = params[param.name] ?? param.default;
		if (value === undefined || value === null || value === '') continue;

		if (param.location === 'path') pathParams[param.name] = value;
		if (param.location === 'query') qs[param.name] = value;
		if (param.location === 'body') body[param.name] = value;
	}

	const preparedBody = spec.resource === 'worker' && spec.operation === 'run'
		? prepareRunWorkerBody(body)
		: compactBody(body);

	return {
		method: spec.method,
		path: replacePathParams(spec.path, pathParams),
		qs,
		body: preparedBody,
		retrySafe: spec.method === 'GET',
	};
}

export async function routeCoreClawOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const resource = this.getNodeParameter('resource', itemIndex) as string;
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const spec = getEndpointSpec(resource, operation);

	if (!spec) {
		throw new NodeOperationError(this.getNode(), `Unknown CoreClaw operation ${resource}.${operation}`, { itemIndex });
	}

	const params = collectParams.call(this, spec, itemIndex);
	const returnAll = spec.supportsReturnAll && (this.getNodeParameter('returnAll', itemIndex, false) as boolean);
	const limit = spec.supportsReturnAll ? (this.getNodeParameter('limit', itemIndex, 20) as number) : undefined;

	const data = returnAll
		? await requestAllPages.call(this, spec, params, limit ?? 20)
		: await coreClawApiRequest.call(this, buildRequestFromSpec(spec, params));

	const outputRows = spec.returnsList ? extractItems(data) : undefined;
	if (outputRows) return this.helpers.returnJsonArray(outputRows);
	return [{ json: (data as IDataObject) ?? {} }];
}

function collectParams(this: IExecuteFunctions, spec: CoreClawEndpointSpec, itemIndex: number): IDataObject {
	const params: IDataObject = {};

	for (const param of spec.params) {
		const rawValue = this.getNodeParameter(param.name, itemIndex, param.default ?? '', { extractValue: true }) as unknown;
		if (param.type === 'json') {
			params[param.name] = parseJsonParameter.call(this, rawValue, param.displayName, itemIndex) as IDataObject;
		} else {
			params[param.name] = rawValue as IDataObject[string];
		}
	}

	if (spec.supportsWaitForFinish) {
		params.waitForFinish = this.getNodeParameter('waitForFinish', itemIndex, false) as boolean;
	}

	return params;
}

async function requestAllPages(
	this: IExecuteFunctions,
	spec: CoreClawEndpointSpec,
	params: IDataObject,
	maxRows: number,
): Promise<IDataObject[]> {
	const rows: IDataObject[] = [];
	let offset = Number(params.offset ?? 0);

	while (rows.length < maxRows) {
		const request = buildRequestFromSpec(spec, { ...params, offset, limit: Math.min(100, maxRows - rows.length) });
		const data = await coreClawApiRequest.call(this, request);
		const pageRows = extractItems(data);
		if (!pageRows || pageRows.length === 0) break;
		rows.push(...pageRows);
		if (pageRows.length < Number(request.qs?.limit ?? request.body?.limit ?? 100)) break;
		offset = nextOffset(offset, pageRows);
	}

	return rows.slice(0, maxRows);
}
```

- [ ] **Step 4: Run router tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/router.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add nodes/CoreClaw/resources/router.ts nodes/CoreClaw/__tests__/router.test.ts
git commit -m "feat: route CoreClaw v2 operations"
```

---

## Task 10: Wire the CoreClaw Action Node

**Files:**
- Modify: `nodes/CoreClaw/CoreClaw.node.ts`
- Modify: `nodes/CoreClaw/CoreClaw.node.json`
- Test: `nodes/CoreClaw/__tests__/endpointScope.test.ts`

- [ ] **Step 1: Update node implementation**

Replace old v1 imports and execution branches in `nodes/CoreClaw/CoreClaw.node.ts` with:

```ts
import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
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
		defaults: { name: 'CoreClaw' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'coreClawApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Store Worker', value: 'storeWorker' },
					{ name: 'Worker', value: 'worker' },
					{ name: 'Worker Run', value: 'workerRun' },
					{ name: 'Worker Task', value: 'workerTask' },
					{ name: 'Proxy', value: 'proxy' },
					{ name: 'Account', value: 'account' },
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
```

- [ ] **Step 2: Update node metadata**

Update `nodes/CoreClaw/CoreClaw.node.json` description to mention API v2 workers, runs, tasks, proxy, and account. Keep icon references unchanged.

- [ ] **Step 3: Run endpoint/UI tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/endpointScope.test.ts
```

Expected: PASS after all description modules compile.

- [ ] **Step 4: Run TypeScript build**

Run:

```powershell
npm run build
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```powershell
git add nodes/CoreClaw/CoreClaw.node.ts nodes/CoreClaw/CoreClaw.node.json nodes/CoreClaw/descriptions nodes/CoreClaw/resources
git commit -m "feat: wire CoreClaw v2 action node"
```

---

## Task 11: Update Credentials for API v2

**Files:**
- Modify: `credentials/CoreClawApi.credentials.ts`
- Test: `nodes/CoreClaw/__tests__/apiClient.test.ts`

- [ ] **Step 1: Add credential test coverage**

Add to `nodes/CoreClaw/__tests__/apiClient.test.ts`:

```ts
import { CoreClawApi } from '../../../credentials/CoreClawApi.credentials';

describe('CoreClawApi credentials', () => {
	it('tests credentials against the v2 account endpoint', () => {
		const credential = new CoreClawApi();
		expect(credential.test.request.url).toBe('/api/v2/users/account');
		expect(credential.test.request.method).toBe('GET');
	});
});
```

- [ ] **Step 2: Run failing credential test**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/apiClient.test.ts
```

Expected: FAIL because credential test still uses `POST /api/v1/account/info`.

- [ ] **Step 3: Update credential**

Modify `credentials/CoreClawApi.credentials.ts`:

- Update documentation description from v1 language to API v2.
- Keep `apiKey` and `baseUrl`.
- Authenticate with both `api-key` and `Authorization`.
- Set credential `test.request.method` to `GET`.
- Set credential `test.request.url` to `/api/v2/users/account`.

The authenticate block should be:

```ts
authenticate: IAuthenticateGeneric = {
	type: 'generic',
	properties: {
		headers: {
			'api-key': '={{$credentials.apiKey}}',
			Authorization: '=Bearer {{$credentials.apiKey}}',
		},
	},
};
```

- [ ] **Step 4: Run credential tests**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/apiClient.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add credentials/CoreClawApi.credentials.ts nodes/CoreClaw/__tests__/apiClient.test.ts
git commit -m "feat: update CoreClaw credentials for api v2"
```

---

## Task 12: Add CoreClaw Trigger Node

**Files:**
- Create: `nodes/CoreClawTrigger/descriptions.ts`
- Create: `nodes/CoreClawTrigger/CoreClawTrigger.node.ts`
- Create: `nodes/CoreClawTrigger/CoreClawTrigger.node.json`
- Test: `nodes/CoreClawTrigger/__tests__/triggerDescription.test.ts`
- Test: `nodes/CoreClawTrigger/__tests__/webhook.test.ts`

- [ ] **Step 1: Write trigger description test**

Create `nodes/CoreClawTrigger/__tests__/triggerDescription.test.ts`:

```ts
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
```

- [ ] **Step 2: Write webhook behavior test**

Create `nodes/CoreClawTrigger/__tests__/webhook.test.ts`:

```ts
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
		} as any;

		await expect(node.webhook.call(context)).resolves.toEqual({
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
		} as any;

		await expect(node.webhook.call(context)).resolves.toEqual({ workflowData: [[]] });
	});
});
```

- [ ] **Step 3: Run failing trigger tests**

Run:

```powershell
npm test -- nodes/CoreClawTrigger/__tests__/triggerDescription.test.ts nodes/CoreClawTrigger/__tests__/webhook.test.ts
```

Expected: FAIL because trigger node does not exist.

- [ ] **Step 4: Implement trigger descriptions**

Create `nodes/CoreClawTrigger/descriptions.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

export const triggerProperties: INodeProperties[] = [
	{
		displayName: 'Event Filter',
		name: 'eventFilter',
		type: 'options',
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Succeeded', value: 'succeeded' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Running', value: 'running' },
			{ name: 'Aborted', value: 'aborted' },
		],
		default: 'any',
		description: 'Run status callback events that should trigger this workflow',
	},
	{
		displayName: 'Validate Payload',
		name: 'validatePayload',
		type: 'boolean',
		default: true,
		description: 'Whether to require run_id and run_status in callback payloads',
	},
	{
		displayName: 'Include Headers',
		name: 'includeHeaders',
		type: 'boolean',
		default: false,
		description: 'Whether to include request headers in output under _headers',
	},
];
```

- [ ] **Step 5: Implement trigger node**

Create `nodes/CoreClawTrigger/CoreClawTrigger.node.ts`:

```ts
import type { IDataObject, INodeType, INodeTypeDescription, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';
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
		defaults: { name: 'CoreClaw Trigger' },
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
```

- [ ] **Step 6: Add node metadata**

Create `nodes/CoreClawTrigger/CoreClawTrigger.node.json`:

```json
{
	"node": "n8n-nodes-coreclaw.CoreClawTrigger",
	"nodeVersion": "1.0",
	"codexVersion": "1.0",
	"categories": ["Development"],
	"resources": {
		"primaryDocumentation": [
			{
				"url": "https://github.com/Core-Claw/n8n-nodes-coreclaw#coreclaw-trigger"
			}
		]
	}
}
```

- [ ] **Step 7: Run trigger tests**

Run:

```powershell
npm test -- nodes/CoreClawTrigger/__tests__/triggerDescription.test.ts nodes/CoreClawTrigger/__tests__/webhook.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add nodes/CoreClawTrigger
git commit -m "feat: add CoreClaw callback trigger node"
```

---

## Task 13: Register Trigger Node in Package Metadata

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add trigger registration**

Update `package.json` `n8n.nodes`:

```json
"nodes": [
	"dist/nodes/CoreClaw/CoreClaw.node.js",
	"dist/nodes/CoreClawTrigger/CoreClawTrigger.node.js"
]
```

Update `description` to API v2 worker language:

```json
"description": "n8n community nodes for CoreClaw API v2 workers, worker runs, saved tasks, results, exports, logs, account data, and run callbacks"
```

Keep `credentials` unchanged.

- [ ] **Step 2: Refresh lockfile metadata**

Run:

```powershell
npm install --package-lock-only
```

Expected: exit code `0`.

- [ ] **Step 3: Build**

Run:

```powershell
npm run build
```

Expected: exit code `0`, with both node files in `dist`.

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json
git commit -m "feat: register CoreClaw trigger node"
```

---

## Task 14: Add Live E2E Test Harness

**Files:**
- Create: `nodes/CoreClaw/__tests__/e2e.live.test.ts`

- [ ] **Step 1: Write opt-in live tests**

Create `nodes/CoreClaw/__tests__/e2e.live.test.ts`:

```ts
const baseUrl = process.env.CORECLAW_BASE_URL || 'https://openapi.coreclaw.com';
const apiKey = process.env.CORECLAW_API_KEY;
const runLive = process.env.CORECLAW_LIVE_TESTS === '1' && !!apiKey;

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
	const json = await response.json();
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
});
```

- [ ] **Step 2: Verify skipped by default**

Run:

```powershell
npm test -- nodes/CoreClaw/__tests__/e2e.live.test.ts
```

Expected: PASS with tests skipped when `CORECLAW_LIVE_TESTS` and `CORECLAW_API_KEY` are not set.

- [ ] **Step 3: Run live smoke tests with local key**

Run in PowerShell without committing the key:

```powershell
$env:CORECLAW_LIVE_TESTS='1'
$env:CORECLAW_API_KEY='<provided key from the user message>'
npm test -- nodes/CoreClaw/__tests__/e2e.live.test.ts
Remove-Item Env:\CORECLAW_API_KEY
Remove-Item Env:\CORECLAW_LIVE_TESTS
```

Expected: PASS or a documented CoreClaw API error with code/message/request ID. Do not paste the key into logs, files, commits, or final answers.

- [ ] **Step 4: Commit**

```powershell
git add nodes/CoreClaw/__tests__/e2e.live.test.ts
git commit -m "test: add CoreClaw live smoke tests"
```

---

## Task 15: Update README and Changelog

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update README**

Rewrite README around API v2:

- Installation.
- Credentials.
- CoreClaw action node resources and operations.
- CoreClaw Trigger callback receiver.
- Canonical workflows:
  - Store Worker List -> Worker Get Input Schema -> Worker Run -> Worker Run Get -> Worker Run List Results.
  - Worker Task List -> Worker Task Run -> Worker Run Export Results.
  - CoreClaw Trigger as callback receiver with its webhook URL copied into `callback_url`.
- Error handling.
- Live E2E tests.
- Explicit excluded endpoint note.

Required README sentence:

```md
This package intentionally does not expose `POST /api/v2/workers/{workerId}/versions`, `PUT /api/v2/workers/{workerId}/versions/{version}`, or `GET /api/v2/workers/{workerId}/internal`.
```

- [ ] **Step 2: Update changelog**

Add a top entry:

```md
## 0.2.0

- Rebuilt the CoreClaw node for CoreClaw API v2.
- Added the CoreClaw Trigger node for callback_url webhook payloads.
- Added v2 worker, worker run, worker task, store, proxy, and account operations.
- Added API envelope error handling, v2 resource locators, pagination, and opt-in live smoke tests.
- Removed API v1 scraper/run/task operation model.
```

- [ ] **Step 3: Add docs verification**

Run:

```powershell
rg -n "/api/v1|scraperSlug|runSlug|Task Slug|Scraper Slug" README.md nodes credentials
```

Expected: no v1/user-facing stale naming remains except historical changelog text if intentionally retained.

- [ ] **Step 4: Commit**

```powershell
git add README.md CHANGELOG.md
git commit -m "docs: update CoreClaw n8n docs for api v2"
```

---

## Task 16: Full Verification and Cleanup

**Files:**
- Whole repository.

- [ ] **Step 1: Run unit and integration tests**

Run:

```powershell
npm test
```

Expected: all non-live tests PASS.

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: exit code `0`.

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: exit code `0`.

- [ ] **Step 4: Run endpoint exclusion audit**

Run:

```powershell
rg -n "/api/v2/workers/\\{workerId\\}/versions|/api/v2/workers/\\{workerId\\}/internal|/api/v1" nodes credentials README.md package.json
```

Expected: no matches for excluded endpoints or `/api/v1` in shipped source/docs.

- [ ] **Step 5: Run secret audit**

Run:

```powershell
$apiKeyPrefix = 'scraper' + '_api_'
rg -n "$apiKeyPrefix|CORECLAW_API_KEY=.*[A-Za-z0-9]" .
```

Expected: no plaintext API key in tracked files. If the search finds documentation text that does not include a key value, inspect manually and keep only safe generic references.

- [ ] **Step 6: Run live smoke tests**

Run:

```powershell
$env:CORECLAW_LIVE_TESTS='1'
$env:CORECLAW_API_KEY='<provided key from the user message>'
npm test -- nodes/CoreClaw/__tests__/e2e.live.test.ts
Remove-Item Env:\CORECLAW_API_KEY
Remove-Item Env:\CORECLAW_LIVE_TESTS
```

Expected: PASS. If a specific endpoint fails because the account has no private workers, tasks, or runs, record the code/message and keep the live test assertion broad enough to prove the endpoint responds correctly without requiring data to exist.

- [ ] **Step 7: Commit final cleanup**

If verification required formatting or cleanup changes:

```powershell
git add .
git commit -m "chore: verify CoreClaw n8n v2 package"
```

If no files changed, do not create an empty commit.

---

## Coverage Checklist

- Endpoint scope: Tasks 2, 3, 8, 10, 16.
- v2 API client and credentials: Tasks 6, 11.
- Run input wrapping: Task 4.
- Pagination/output shape: Tasks 5, 9.
- Resource locators: Task 7.
- CoreClaw action node: Tasks 8, 9, 10, 13.
- CoreClaw Trigger node: Tasks 12, 13.
- Docs and changelog: Task 15.
- Live E2E and no secret leakage: Tasks 14, 16.
