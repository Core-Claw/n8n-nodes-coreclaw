# CoreClaw n8n API v2 Productized Redesign

## Goal

Rewrite `n8n-nodes-coreclaw` from the current API v1 scraper-oriented node into an API v2 CoreClaw integration that is reliable, convenient, user-friendly, enterprise-ready, and commercializable.

The package will expose two n8n nodes:

- `CoreClaw`: an action node for CoreClaw API v2 discovery, execution, run management, results, exports, logs, tasks, proxy regions, and account info.
- `CoreClaw Trigger`: a webhook trigger node that receives CoreClaw run callback payloads and starts n8n workflows.

## Authoritative Sources

The implementation must use these local sources as the source of truth:

- `D:\Coreclaw_Work\github\exported-api-docs`
- `D:\Coreclaw_Work\github\scraper-webui-docs\src\content\docs\api`
- `D:\Coreclaw_Work\github\coreclaw-mcp-server`

`D:\Coreclaw_Work\github\n8n-nodes-apify` is a design and implementation reference only. It is useful for package layout, resource routers, resource locators, request helpers, polling, trigger patterns, and workflow-level tests, but CoreClaw behavior must follow the CoreClaw API v2 docs and MCP implementation.

## Endpoint Scope

The action node must expose exactly 28 API v2 operations from `exported-api-docs\endpoints.csv`.

These three endpoints must not be exposed in the n8n UI, tests, operation specs, docs, or convenience helpers:

- `POST /api/v2/workers/{workerId}/versions`
- `PUT /api/v2/workers/{workerId}/versions/{version}`
- `GET /api/v2/workers/{workerId}/internal`

Allowed operations:

| Resource | Operation | Method | Path |
| --- | --- | --- | --- |
| Proxy | List Regions | `GET` | `/api/v2/proxy/region` |
| Store Worker | List/Search | `GET` | `/api/v2/store` |
| Account | Get Info | `GET` | `/api/v2/users/account` |
| Worker Run | List | `GET` | `/api/v2/worker-runs` |
| Worker Run | Get Last | `GET` | `/api/v2/worker-runs/last` |
| Worker Run | Abort Last | `POST` | `/api/v2/worker-runs/last/abort` |
| Worker Run | Export Last Results | `GET` | `/api/v2/worker-runs/last/export` |
| Worker Run | Get Last Log | `GET` | `/api/v2/worker-runs/last/log` |
| Worker Run | Rerun Last | `POST` | `/api/v2/worker-runs/last/rerun` |
| Worker Run | List Last Results | `GET` | `/api/v2/worker-runs/last/result` |
| Worker Run | Get | `GET` | `/api/v2/worker-runs/{runId}` |
| Worker Run | Abort | `POST` | `/api/v2/worker-runs/{runId}/abort` |
| Worker Run | Get Log | `GET` | `/api/v2/worker-runs/{runId}/log` |
| Worker Run | Rerun | `POST` | `/api/v2/worker-runs/{runId}/rerun` |
| Worker Run | List Results | `GET` | `/api/v2/worker-runs/{runId}/result` |
| Worker Run | Export Results | `GET` | `/api/v2/worker-runs/{runId}/result/export` |
| Worker Task | List | `GET` | `/api/v2/worker-tasks` |
| Worker Task | Run | `POST` | `/api/v2/worker-tasks/{workerTaskId}/runs` |
| Worker | List | `GET` | `/api/v2/workers` |
| Worker | Get | `GET` | `/api/v2/workers/{workerId}` |
| Worker | Get Input Schema | `GET` | `/api/v2/workers/{workerId}/input-schema` |
| Worker | Run | `POST` | `/api/v2/workers/{workerId}/runs` |
| Worker | Get Last Run | `GET` | `/api/v2/workers/{workerId}/runs/last` |
| Worker | Abort Last Run | `POST` | `/api/v2/workers/{workerId}/runs/last/abort` |
| Worker | Export Last Run Results | `GET` | `/api/v2/workers/{workerId}/runs/last/export` |
| Worker | Get Last Run Log | `GET` | `/api/v2/workers/{workerId}/runs/last/log` |
| Worker | Rerun Last Run | `POST` | `/api/v2/workers/{workerId}/runs/last/rerun` |
| Worker | List Last Run Results | `GET` | `/api/v2/workers/{workerId}/runs/last/result` |

## Package Shape

The package remains an n8n community node package with `n8nNodesApiVersion: 1`, TypeScript sources, SVG icons, and `@n8n/node-cli` build/lint scripts.

`package.json` must register:

- `dist/credentials/CoreClawApi.credentials.js`
- `dist/nodes/CoreClaw/CoreClaw.node.js`
- `dist/nodes/CoreClawTrigger/CoreClawTrigger.node.js`

The package should add Jest/nock-based tests, following the Apify package pattern where practical.

## Credentials

Credential type: `coreClawApi`.

Fields:

- `API Key`: required password field.
- `Base URL`: default `https://openapi.coreclaw.com`; user-editable for private deployments.

Default request auth for CoreClaw API v2 should send:

- `api-key: <API Key>`
- `Authorization: Bearer <API Key>`

The MCP REST shim accepts `api-key`, `X-API-Key`, and bearer auth. Sending both `api-key` and bearer auth is conservative for v2 compatibility; if live API rejects one of them during E2E testing, the implementation must narrow to the documented working header.

Credential test:

- Calls `GET /api/v2/users/account`.
- Treats `code: 0` as success.
- Surfaces CoreClaw `code`, `message`, `request_id`, and `details` on failure.

## Action Node UX

The `CoreClaw` action node resources:

- `Store Worker`
- `Worker`
- `Worker Run`
- `Worker Task`
- `Proxy`
- `Account`

Resource operation groups:

- `Store Worker`: `List`
- `Worker`: `List`, `Get`, `Get Input Schema`, `Run`, `Get Last Run`, `Abort Last Run`, `Export Last Run Results`, `Get Last Run Log`, `Rerun Last Run`, `List Last Run Results`
- `Worker Run`: `List`, `Get`, `Abort`, `Get Log`, `Rerun`, `List Results`, `Export Results`, `Get Last`, `Abort Last`, `Export Last Results`, `Get Last Log`, `Rerun Last`, `List Last Results`
- `Worker Task`: `List`, `Run`
- `Proxy`: `List Regions`
- `Account`: `Get Info`

Names must use v2 nouns:

- Use `Worker ID`, not `Scraper Slug`.
- Use `Run ID`, not `Run Slug` in display text, while allowing existing API examples that call it a slug.
- Use `Worker Task ID`, not `Task Slug`.

The node remains `usableAsTool: true`.

## Resource Locators and Load Options

The action node should provide resource locators where they materially improve usability:

- `Worker ID` locator:
  - From public store workers via `GET /api/v2/store`.
  - From current user's workers via `GET /api/v2/workers`.
  - Manual ID/path entry.
  - Values should support worker slugs and owner paths such as `owner~worker`.
- `Worker Task ID` locator:
  - From `GET /api/v2/worker-tasks`.
  - Manual ID entry.
- `Run ID` locator:
  - From `GET /api/v2/worker-runs`.
  - Manual ID entry.

Locator options should show meaningful labels from returned data, preferring title plus path/slug where available.

## Request and Response Handling

Implement one shared CoreClaw API client.

Responsibilities:

- Resolve `baseUrl` without trailing slash.
- Build path, query string, and JSON request body.
- Use n8n `httpRequestWithAuthentication`.
- Use JSON requests and responses.
- Apply a sane default timeout.
- Retry only safe idempotent reads on 429, 500, and network timeouts, using bounded exponential backoff.
- Do not retry run, rerun, or abort POST operations because retries could create duplicate jobs or unexpected state changes.
- Decode CoreClaw response envelopes.
- Treat non-zero `code` values as application errors even when HTTP status is 200.
- Preserve raw response data for successful calls.
- Include `request_id` and `details` in errors when present.

Envelope rules:

- Success requires object response with numeric `code`.
- `code === 0` returns `data`.
- Non-zero `code` throws `NodeApiError` with a mapped hint from `exported-api-docs\error-codes.md` and MCP `types.go`.
- Missing envelope throws `NodeApiError` with "Unexpected CoreClaw response shape".

## Input Handling for Run Operations

`Worker -> Run` supports two input modes:

- `Input JSON`: user supplies worker business/custom input. The node sends it upstream as:

```json
{
  "input": {
    "parameters": {
      "custom": {}
    }
  }
}
```

- `Raw Input JSON`: advanced full CoreClaw `input` object. The node sends it as the `input` value without wrapping.

The two modes are mutually exclusive. If both are provided, the node throws a `NodeOperationError`.

Run request body fields:

- `version`
- `input`
- `is_async`
- `callback_url`
- `offset`
- `limit`

`Worker Task -> Run` and rerun operations support:

- `is_async`
- `callback_url`
- `offset`
- `limit`

The default for `is_async` should be `true`. For synchronous runs, `offset` and `limit` control returned synchronous result windows.

## Run Completion Convenience

For `Worker -> Run`, `Worker Task -> Run`, and rerun operations, add an optional `Wait for Finish` field.

When enabled:

- Force or keep `is_async: true` for initial execution unless live API confirms synchronous mode is better for this path.
- Poll the relevant run detail endpoint until terminal status.
- Terminal statuses: `succeeded`, `failed`, `aborted`, plus `abort*` variants if observed in real API.
- Return the final run object.

The first implementation must not add a separate "Run and Get Results" operation, because the action node operation list must stay one-to-one with the 28 allowed API endpoints. Users fetch rows by chaining `List Results`, `List Last Results`, or the worker-specific last-result operation after a run finishes.

## Pagination and Output Shape

List/result operations support:

- `Return All`
- `Limit`
- `Offset`

For list operations, if `Return All` is enabled, the node repeatedly calls with `offset` increments until no more records or requested limit is reached.

The output should be user-friendly:

- Operations returning arrays should emit one n8n item per record.
- Operations returning a single object should emit one item.
- Export operations should return the API data object, including download URL fields.
- Continue On Fail returns an item with `error`, `errorDescription`, `coreclawCode`, and `requestId` when available.

Because the v2 docs show response payloads but do not enforce one common array key, extraction should handle common keys observed in docs and MCP testing:

- `items`
- `records`
- `list`
- `data`
- `results`

If the response shape is ambiguous, return the full object rather than silently dropping data.

## Trigger Node UX

The `CoreClaw Trigger` node is a local n8n webhook receiver for CoreClaw callback payloads.

It does not call a CoreClaw remote webhook registration API because no such endpoint exists in the authoritative v2 docs. Users connect it by copying the n8n webhook URL into `callback_url` on `Run`, `Run Worker Task`, or rerun operations.

Trigger configuration:

- `Event Filter`: `Any`, `Succeeded`, `Failed`, `Running`, `Aborted`.
- `Include Headers`: boolean, default `false`.
- `Response Mode`: immediate success response.

Webhook behavior:

- Accept `POST`.
- Parse JSON body.
- Validate the payload has at least `run_id` and `run_status` when validation is enabled.
- Output the callback payload as a n8n item.
- Optionally include request headers under `_headers`.

Documented callback shape comes from `PlatformCallbackRequest`:

- `run_id`
- `run_status`
- `error_message`
- `execution_start_timestamp`
- `execution_end_timestamp`
- `running_duration`
- `result_count`
- `result_message`

## File Boundaries

Target structure:

```text
credentials/
  CoreClawApi.credentials.ts
nodes/
  CoreClaw/
    CoreClaw.node.ts
    CoreClaw.node.json
    GenericFunctions.ts
    constants.ts
    types.ts
    descriptions/
      AccountDescription.ts
      ProxyDescription.ts
      StoreWorkerDescription.ts
      WorkerDescription.ts
      WorkerRunDescription.ts
      WorkerTaskDescription.ts
    resources/
      endpointSpecs.ts
      router.ts
      locators.ts
      pagination.ts
      runInput.ts
  CoreClawTrigger/
    CoreClawTrigger.node.ts
    CoreClawTrigger.node.json
    descriptions.ts
```

Tests:

```text
nodes/CoreClaw/__tests__/
  apiClient.test.ts
  endpointScope.test.ts
  runInput.test.ts
  router.test.ts
  pagination.test.ts
  locators.test.ts
  e2e.live.test.ts
nodes/CoreClawTrigger/__tests__/
  triggerDescription.test.ts
  webhook.test.ts
```

The existing v1 description files can be replaced rather than migrated piecemeal if that keeps the v2 model clearer.

## Documentation

Update `README.md` to cover:

- API v2 support.
- Installation.
- Credentials.
- Action node resources and operations.
- Trigger node callback workflow.
- Canonical workflows:
  - Store search -> input schema -> run worker -> get run -> list results.
  - Run task -> wait -> export results.
  - CoreClaw Trigger receiving callback from `callback_url`.
- Error handling and `Continue On Fail`.
- Explicit note that worker version create/update and internal worker detail APIs are not exposed.

Update `CHANGELOG.md` with the v2 rewrite.

## Test Strategy

Use TDD for implementation.

Unit and integration tests must prove:

- Exactly 28 endpoint specs are exposed.
- The three excluded endpoints are absent from endpoint specs, UI operation options, README operation docs, and tests.
- Credential test calls `GET /api/v2/users/account`.
- API client unwraps `code: 0` and throws on non-zero `code`.
- Error mapping covers all codes in `exported-api-docs\error-codes.md`.
- `input_json` is wrapped as `input.parameters.custom`.
- `raw_input_json` is passed through.
- Supplying both input modes fails before HTTP call.
- Query/body/path parameters are mapped to v2 names.
- GET retries are bounded; POST run/rerun/abort calls are not retried.
- Return All pagination accumulates records without dropping final partial pages.
- Continue On Fail preserves paired items and useful CoreClaw error fields.
- Trigger node accepts callback payloads and filters by status.
- Build and lint pass.

Live E2E tests:

- Use the provided API key only through a local environment variable, never in source, docs, snapshots, logs committed to git, or fixtures.
- Cover account info, store list, proxy regions, worker/task/runs listing, worker input schema, at least one safe worker run if a suitable low-risk worker is available, run status polling, results/log/export where available.
- Live tests must be opt-in, for example `CORECLAW_LIVE_TESTS=1`.

## Acceptance Criteria

The rewrite is complete only when current evidence proves all of the following:

- The package builds with `npm run build`.
- Lint passes with `npm run lint`.
- Unit/integration tests pass.
- Live E2E tests have been run with the provided credential or any live limitations are explicitly documented with evidence.
- The action node exposes all and only the 28 allowed API v2 operations.
- The trigger node can receive a CoreClaw callback payload through n8n webhook execution.
- README and changelog match the implemented behavior.
- No plaintext API key is present in tracked files or final output.
