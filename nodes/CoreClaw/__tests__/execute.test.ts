import type { IExecuteFunctions, INode } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { CoreClaw } from '../CoreClaw.node';

jest.mock('../resources/router', () => ({
	routeCoreClawOperation: jest.fn(),
}));

import { routeCoreClawOperation } from '../resources/router';

const mockedRoute = routeCoreClawOperation as jest.MockedFunction<typeof routeCoreClawOperation>;

function createExecuteContext(continueOnFail: boolean): IExecuteFunctions {
	return {
		getInputData: () => [{ json: { input: 1 } }],
		continueOnFail: () => continueOnFail,
	} as unknown as IExecuteFunctions;
}

const node: INode = {
	id: 'coreclaw-node',
	name: 'CoreClaw',
	type: 'n8n-nodes-coreclaw.coreClaw',
	typeVersion: 2,
	position: [0, 0],
	parameters: {},
};

describe('CoreClaw execute', () => {
	afterEach(() => {
		mockedRoute.mockReset();
	});

	it('emits structured CoreClaw error fields when continue on fail is enabled', async () => {
		const error = new NodeApiError(
			node,
			{ code: 12001, request_id: 'req-1', details: ['bad token'] },
			{
				message: 'CoreClaw error 12001',
				description: 'authentication required | request_id: req-1',
			},
		);
		Object.assign(error, {
			coreclawCode: 12001,
			requestId: 'req-1',
			details: ['bad token'],
		});
		mockedRoute.mockRejectedValueOnce(error);

		await expect(new CoreClaw().execute.call(createExecuteContext(true))).resolves.toEqual([
			[
				{
					json: {
						error: 'CoreClaw error 12001',
						errorDescription: 'authentication required | request_id: req-1',
						coreclawCode: 12001,
						requestId: 'req-1',
						details: ['bad token'],
					},
					pairedItem: { item: 0 },
				},
			],
		]);
	});
});
