# Changelog

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
