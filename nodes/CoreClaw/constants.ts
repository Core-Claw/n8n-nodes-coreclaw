export const CORECLAW_DEFAULT_BASE_URL = 'https://openapi.coreclaw.com';

export const CORECLAW_DEFAULT_TIMEOUT_MS = 60_000;

export const CORECLAW_RESULT_LIMIT_MAX = 100;

export const CORECLAW_TERMINAL_RUN_STATUSES = [
	'succeeded',
	'failed',
	'aborted',
] as const;

/**
 * Run statuses that indicate the run finished unsuccessfully. The Run and Get
 * Results composite operations use this to surface the run log instead of an
 * empty result set when the run did not succeed.
 */
export const CORECLAW_FAILED_RUN_STATUSES = ['failed', 'aborted'] as const;

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
