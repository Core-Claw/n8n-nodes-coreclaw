import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CoreClawApi implements ICredentialType {
	name = 'coreClawApi';

	displayName = 'CoreClaw API';

	documentationUrl = 'https://github.com/Core-Claw/n8n-nodes-coreclaw#credentials';

	icon = { light: 'file:icons/coreclaw.svg', dark: 'file:icons/coreclaw.dark.svg' } as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your CoreClaw API key. Generate one at coreclaw.com → Console → API Keys.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://openapi.coreclaw.com',
			description:
				'CoreClaw API base URL. Override only when targeting a private deployment.',
			placeholder: 'https://openapi.coreclaw.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.baseUrl?.replace(/\\/$/, "") || "https://openapi.coreclaw.com"}}',
			url: '/api/v1/account/info',
			method: 'POST',
			body: {},
			headers: {
				'Content-Type': 'application/json',
				'api-key': '={{$credentials.apiKey}}',
			},
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message: 'Invalid CoreClaw API key — verify the key at coreclaw.com → Console → API Keys.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 400,
					message: 'CoreClaw API key is missing — verify the credential API Key field.',
				},
			},
		],
	};
}
