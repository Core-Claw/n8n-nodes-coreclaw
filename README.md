# n8n-nodes-coreclaw

Use [CoreClaw](https://coreclaw.com) in n8n to search the scraper marketplace, run scrapers, fetch structured results, and manage runs — directly from your workflows.

CoreClaw is a managed scraper marketplace: thousands of ready-to-run scrapers (Amazon, Google Maps, TikTok, Twitter, …) you can launch with one API call and consume in n8n like any other data source.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Example workflow](#example-workflow)
- [Error handling](#error-handling)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

In short, on n8n self-hosted:

1. Go to **Settings → Community Nodes**.
2. Click **Install** and enter `n8n-nodes-coreclaw`.
3. Reload the editor — the **CoreClaw** node will appear in the node panel.

## Credentials

1. Sign up at [coreclaw.com](https://coreclaw.com).
2. Create an API key in **Console → API Keys**.
3. In n8n, create a credential of type **CoreClaw API**:

| Field | Value |
| --- | --- |
| **API Key** | Your CoreClaw API key. |
| **Base URL** | `https://openapi.coreclaw.com` (default — only change for private deployments). |

The credential is sent as a request header `api-key: <your-key>`. n8n's credential test calls `POST /api/v1/account/info` and surfaces an error if the key is rejected.

## Operations

The node groups operations under four resources, mapping 1:1 to the CoreClaw REST API.

### Scraper
- **Search** — Search the marketplace by keyword.
- **Get Details** — Get a scraper's `version`, default `system_params`, `custom_params_schema`, and README.
- **Run** — Start an asynchronous scraper run. Returns a `run_slug`.

### Run
- **Get** — Get current execution status.
- **Get Many** — List historical runs with pagination + filters.
- **Get Results** — Fetch paginated result records from a finished run.
- **Export Results** — Get a temporary download URL for the full result set as CSV / JSON.
- **Get Logs** — Fetch execution logs.
- **Abort** — Stop an in-flight run.
- **Rerun** — Re-execute a previous run with identical inputs.

### Task
- **Run** — Run a saved task configured in the CoreClaw console.

### Account
- **Get Info** — Fetch your balance, traffic usage, and plan expiration.

Run statuses: `1=Ready`, `2=Running`, `3=Succeeded`, `4=Failed`, `5=Aborting`.

## Example workflow

The canonical pattern is **Search → Get Details → Run → poll Get → Get Results**.

```
[Manual Trigger]
   ↓
[CoreClaw: Search]         query="amazon", limit=5
   ↓
[CoreClaw: Get Details]    scraperSlug={{ $json.slug }}
   ↓
[CoreClaw: Run]            scraperSlug={{ ... }}
                           version={{ $json.version }}
                           customParams={ "startURLs": [{"url":"https://amazon.com/dp/B001"}] }
   ↓
[Wait 5s]
   ↓
[CoreClaw: Get]            runSlug={{ $json.run_slug }}
   ↓
[IF status == 3]
   ├─ true  → [CoreClaw: Get Results]   runSlug={{ ... }}, returnAll=true
   └─ false → [Wait + loop back]
```

The `version` and the shape of `customParams` come from **Get Details** — don't invent them.

**Async completion via Webhook:** instead of polling, set **Additional Fields → Callback URL** on **Run / Run Task / Rerun** to an n8n Webhook node URL. CoreClaw POSTs the run completion event to that URL.

## Error handling

CoreClaw always responds with HTTP 200 — application errors are encoded in a `code` field in the body. This node decodes that envelope and surfaces actionable `NodeApiError`s in n8n. Enable **Continue On Fail** to surface errors in the output stream (with `error` and `errorDescription` fields) instead of halting the workflow.

The most common error is `[50002] Scraper run failed` on **Run** — usually a required field in `customParams` is missing or null. Call **Get Details** first and check `custom_params_schema`.

For the full error code reference, see the [CoreClaw API documentation](https://docs.coreclaw.com/api/).

## Compatibility

- Requires n8n `1.x` (`n8nNodesApiVersion` 1).
- Requires Node.js `>=20.15`.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [CoreClaw API documentation](https://docs.coreclaw.com/api/)
- [CoreClaw marketplace](https://coreclaw.com/store)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
