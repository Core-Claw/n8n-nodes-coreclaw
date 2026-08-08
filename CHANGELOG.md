# Changelog

## 0.5.1

- **Fixed Queue Run crashing with "Could not find property"**: the Queue Run spec carried body `offset`/`limit` params (which the API accepts but ignores) that had no matching UI fields, so `collectParams` threw on every execution — same regression class as 0.4.1. Queue Run now surfaces only `callback_url` and `is_async`; a new invariant test guards that every spec param has a rendered UI field.
- **Trigger payload validation now matches the v2 callback contract**: CoreClaw v2 callbacks identify runs with `run_slug`, not `run_id`; `validatePayload` (on by default) previously rejected real callbacks. It now requires `run_slug` + `run_status`.
- **Required body params are validated**: blank `queue_refs` (and any other required body param) now fails with a readable "X is required" error instead of sending an empty body and surfacing a bare `11000`.
- **`owner/name` worker paths are converted to `owner~name`** before URL encoding in path parameters (an encoded `%2F` was previously sent as a different route segment).
- **`returnAll` normalizes `offset: 0` to page 1** so pagination does not re-fetch the first page (offset 0 is accepted as page 1 by the API).
- **CoreClaw application error codes are no longer surfaced as `httpCode`** on `NodeApiError` (they are business codes, not HTTP statuses); removed the unused `CORECLAW_RESULT_LIMIT_MAX` constant.

## 0.5.0

- Added the **Run Queue** resource with five operations: **Queue Run**, **List Items**, **Activate Items**, **Release Items**, and **Release One Item**. Queue Run submits a worker run for later activation (input is wrapped as `input.parameters.custom`, same as Worker > Run) and returns a `queue_ref`; Activate starts waiting items; Release discards one or many queued items. Maps the public `POST /workers/{workerId}/queued-runs`, `GET /run-queue/items`, `POST /run-queue/items/activate`, `POST /run-queue/items/release`, and `POST /run-queue/items/{queueId}/release` endpoints.
- Added `start_time` and `end_time` Unix-second filters to **Worker Run > List** (filter `created_at`; both required together, both must be in the same calendar month; when omitted CoreClaw returns the current month's runs).
- Added error hint for `30003 PLAN_CONCURRENCY_LIMITED` (wait for existing runs before starting or activating more).
- Synchronized the public API v2 surface with the CoreClaw docs, MCP server, and Skill: 39 public operations, four excluded internal operations (`versions` POST/PUT, `internal` GET, `queued-worker-runs` GET).
- Operation count is now 39 (was 34).

## 0.4.1

- Fixed `Run and Get Results` (and `Rerun and Get Results`) failing with `NodeOperationError: Could not find property`. The composite specs spread the trigger's `runBodyParams` (`callback_url` / `is_async` / body `offset`+`limit`) and result pagination into `spec.params`, but `WorkerDescription` only displays those fields for `run` / `rerunLastRun` / `abortLastRun` — never for the composite operations — so `collectParams`' `getNodeParameter(..., { extractValue: true })` threw. Composite specs now surface only the trigger's identifying/input params (`workerId` / `workerTaskId` / `runId` / `version` / `input_json` / `raw_input_json`); result `offset` / `limit` are read directly in `executeRunAndGetResults` without `extractValue`, so they tolerate the `limit` field being hidden when `returnAll` is true. Verified end-to-end against a live CoreClaw run.

## 0.4.0

- Added **Worker Task CRUD** operations: Create, Get, Update, Delete, Get Input, and Update Input. Create and Update Input wrap the `input_json` field as `input.parameters.custom`, matching the CoreClaw saved task payload contract (a flat input makes a saved task un-runnable).
- Generalized run input wrapping behind a `wrapsInput` spec flag so run_worker, create_worker_task, and update_worker_task_input all share the same `input.parameters.custom` wrapping.
- Fixed abort operations (`Abort Last`, `Abort Worker Last Run`) to send no request body, matching the CoreClaw v2 API (abort has no documented body). `Abort Worker Run` was already correct.
- Added unit tests for the new task CRUD request bodies, the wrapsInput flag, and the abort-body invariant; added a live end-to-end test that creates, reads, updates input, and deletes a worker task.
- Operation count is now 34 (was 28).

## 0.3.0

- Added one-step **Run and Get Results** composite operations on Worker, Worker Task, and Worker Run (Rerun and Get Results). Each submits a run, polls to a terminal status, and returns the result rows as n8n items — mirroring Apify's "Run and get dataset items" UX.
- Composite operations surface the run log in the error when a run fails or is aborted.
- Fixed run terminal-status detection: `aborting` is no longer treated as terminal; polling now continues until `succeeded`, `failed`, or `aborted`.
- Reworked README with a table of contents, composite-operation guide, refreshed workflow examples, and a troubleshooting table.
- Added unit tests for the composite operations (run, task, rerun, pagination, failed-run log).

## 0.2.0

- Rebuilt the CoreClaw node for CoreClaw API v2.
- Added the CoreClaw Trigger node for callback_url webhook payloads.
- Added v2 worker, worker run, worker task, store, proxy, and account operations.
- Added API envelope error handling, v2 resource locators, pagination, and opt-in live smoke tests.
- Removed API v1 scraper/run/task operation model.

## 0.1.1

- Replace placeholder icon with the official CoreClaw brand mark (cyan-to-blue gradient claw).

## 0.1.0

- Initial CoreClaw community node release with Scraper, Run, Task, and Account operations.
- Uses `api-key` header authentication and a credential test against the legacy account info endpoint.
