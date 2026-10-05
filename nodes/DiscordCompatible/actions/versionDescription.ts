/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';

import * as channel from './channel';
import * as member from './member';
import * as message from './message';
import * as webhook from './webhook';

export const versionDescription: INodeTypeDescription = {
	displayName: 'Discord Compatible',
	name: 'discordCompatible',
	icon: { light: 'file:discordCompatible.svg', dark: 'file:discordCompatible.dark.svg' },
	group: ['output'],
	version: 1,
	usableAsTool: true,
	subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
	description: 'Sends data to any Discord-compatible API (Discord, Fluxer, and similar servers)',
	defaults: {
		name: 'Discord Compatible',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: ['main'],
	credentials: [
		{
			name: 'discordCompatibleApi',
			required: true,
			displayOptions: {
				show: {
					authentication: ['botToken'],
				},
			},
		},
		{
			name: 'discordCompatibleWebhookApi',
			required: true,
			displayOptions: {
				show: {
					authentication: ['webhook'],
				},
			},
		},
	],
	properties: [
		{
			displayName: 'Connection Type',
			name: 'authentication',
			type: 'options',
			options: [
				{
					name: 'Bot Token',
					value: 'botToken',
					description: 'Manage messages, channels, and members on a server',
				},
				{
					name: 'Webhook',
					value: 'webhook',
					description: 'Send messages to a specific channel',
				},
			],
			default: 'botToken',
		},
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'Channel', value: 'channel' },
				{ name: 'Member', value: 'member' },
				{ name: 'Message', value: 'message' },
			],
			default: 'channel',
			displayOptions: {
				hide: {
					authentication: ['webhook'],
				},
			},
		},

		...message.description,
		...channel.description,
		...member.description,
		...webhook.description,
	],
};
