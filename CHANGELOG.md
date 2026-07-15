# Changelog

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
