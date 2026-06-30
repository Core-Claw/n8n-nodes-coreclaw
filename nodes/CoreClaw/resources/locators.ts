import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { coreClawApiRequest } from '../GenericFunctions';
import { extractItems } from './pagination';

export function normalizeList(data: unknown): IDataObject[] {
	return extractItems(data) ?? [];
}

export function formatWorkerOption(worker: IDataObject) {
	const value = String(worker.path || worker.slug || worker.worker_id || worker.id || '').trim();
	const title = String(worker.title || worker.name || value || '(unnamed worker)');
	const description = worker.description ? String(worker.description) : undefined;

	return {
		name: value && title !== value ? `${title} (${value})` : title,
		value,
		description,
		url: value ? `https://coreclaw.com/store/${encodeURIComponent(value)}` : undefined,
	};
}

export function formatWorkerTaskOption(task: IDataObject) {
	const value = String(task.worker_task_id || task.task_id || task.slug || task.id || '').trim();
	const title = String(task.title || task.name || value || '(unnamed task)');
	const description = task.worker_id ? String(task.worker_id) : undefined;

	return {
		name: value && title !== value ? `${title} (${value})` : title,
		value,
		description,
	};
}

export function formatRunOption(run: IDataObject) {
	const value = String(run.run_id || run.run_slug || run.id || '').trim();
	const status = String(run.run_status || run.status || 'unknown');
	const worker = String(run.worker_id || run.worker_slug || run.worker_name || '');

	return {
		name: value ? `${value} (${status})` : `(unknown run) (${status})`,
		value,
		description: worker || undefined,
	};
}

export const locatorMethods = {
	async searchStoreWorkers(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/store',
			qs: { keyword: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatWorkerOption).filter((option) => option.value) };
	},

	async searchWorkers(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/workers',
			qs: { keyword: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatWorkerOption).filter((option) => option.value) };
	},

	async searchWorkerTasks(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/worker-tasks',
			qs: { keyword: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatWorkerTaskOption).filter((option) => option.value) };
	},

	async searchWorkerRuns(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const data = await coreClawApiRequest.call(this, {
			method: 'GET',
			path: '/api/v2/worker-runs',
			qs: { worker_id: filter || '', offset: 0, limit: 50 },
			retrySafe: true,
		});
		return { results: normalizeList(data).map(formatRunOption).filter((option) => option.value) };
	},
};
