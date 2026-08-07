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
	// CoreClaw uses 1-based page numbering: offset is the page number, not a
	// row skip count. Increment by 1 to advance to the next page.
	return currentOffset + 1;
}
