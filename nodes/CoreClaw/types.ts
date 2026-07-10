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
	/**
	 * When true, the router wraps the `input_json` body parameter as
	 * `input.parameters.custom` before sending it upstream — matching
	 * CoreClaw's saved task payload contract. Set on run_worker,
	 * create_worker_task, and update_worker_task_input. Without this, a
	 * created task stores an unwrapped input that fails to run.
	 */
	wrapsInput?: boolean;
	/**
	 * Composite operations chain multiple API calls into one node (e.g. run a
	 * worker, poll until it finishes, then return its result rows). They are
	 * not executed through the standard single-request router path.
	 */
	composite?: 'runAndGetResults';
	/**
	 * For composite operations, the spec of the API call that starts the run
	 * (e.g. POST /workers/{workerId}/runs). The composite executor uses this to
	 * build the trigger request, then polls and fetches results.
	 */
	compositeTrigger?: CoreClawEndpointSpec;
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
