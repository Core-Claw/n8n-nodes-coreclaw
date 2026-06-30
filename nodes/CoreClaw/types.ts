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
