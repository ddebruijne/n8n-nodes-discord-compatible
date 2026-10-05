import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DiscordCompatibleApi implements ICredentialType {
	name = 'discordCompatibleApi';

	displayName = 'Discord-Compatible API';

	documentationUrl = 'https://discord.com/developers/docs/reference';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://discord.com/api/v10',
			required: true,
			description:
				'Root of the Discord-compatible REST API. Discord: https://discord.com/api/v10. Fluxer: https://your-fluxer-host (the /api suffix is added automatically) or a full path such as https://your-fluxer-host/api',
			placeholder: 'e.g. https://fluxer.example.com/api',
		},
		{
			displayName: 'Bot Token',
			name: 'botToken',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description: 'Bot token sent as an "Authorization: Bot <token>" header',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bot {{$credentials.botToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			// Mirrors the node's base-URL handling: a base without an /api segment gets one
			url: '={{ $credentials.baseUrl.includes("/api") ? "/users/@me" : "/api/users/@me" }}',
		},
	};
}
