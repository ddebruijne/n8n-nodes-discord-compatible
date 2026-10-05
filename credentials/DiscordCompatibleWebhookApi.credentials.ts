import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class DiscordCompatibleWebhookApi implements ICredentialType {
	name = 'discordCompatibleWebhookApi';

	displayName = 'Discord-Compatible Webhook API';

	documentationUrl = 'https://support.discord.com/hc/en-us/articles/228383668';

	properties: INodeProperties[] = [
		{
			displayName: 'Webhook URL',
			name: 'webhookUri',
			type: 'string',
			default: '',
			required: true,
			description:
				'Full webhook URL used to post messages without a bot, e.g. https://discord.com/api/webhooks/123/abc or https://your-fluxer-host/api/webhooks/123/abc',
		},
	];
}
