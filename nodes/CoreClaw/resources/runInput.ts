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
