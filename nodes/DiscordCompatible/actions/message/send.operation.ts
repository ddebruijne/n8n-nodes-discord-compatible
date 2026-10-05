import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import {
	parseApiError,
	prepareEmbeds,
	prepareErrorData,
	prepareMultiPartForm,
	prepareOptions,
} from '../../helpers/utils';
import { discordApiMultiPartRequest, discordApiRequest } from '../../transport';
import { embedsFixedCollection, filesFixedCollection, sendToProperties } from '../common.description';

const properties: INodeProperties[] = [
	...sendToProperties,
	{
		displayName: 'Message',
		name: 'content',
		type: 'string',
		default: '',
		description: 'The content of the message (up to 2000 characters)',
		placeholder: 'e.g. My message',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [
			{
				displayName: 'Flags',
				name: 'flags',
				type: 'multiOptions',
				default: [],
				description:
					'Message flags. <a href="https://discord.com/developers/docs/resources/channel#message-object-message-flags" target="_blank">More info</a>.',
				options: [
					{ name: 'Suppress Embeds', value: 'SUPPRESS_EMBEDS' },
					{ name: 'Suppress Notifications', value: 'SUPPRESS_NOTIFICATIONS' },
				],
			},
			{
				displayName: 'Message to Reply To',
				name: 'message_reference',
				type: 'string',
				default: '',
				description: 'Fill this to make your message a reply. Add the message ID.',
				placeholder: 'e.g. 1059467601836773386',
			},
			{
				displayName: 'Text-to-Speech (TTS)',
				name: 'tts',
				type: 'boolean',
				default: false,
				description: 'Whether to have the message read out loud in the channel',
			},
		],
	},
	embedsFixedCollection,
	filesFixedCollection,
];

const displayOptions = {
	show: {
		resource: ['message'],
		operation: ['send'],
	},
	hide: {
		authentication: ['webhook'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	guildId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const items = this.getInputData();

	for (let i = 0; i < items.length; i++) {
		try {
			const sendTo = this.getNodeParameter('sendTo', i) as string;
			const content = this.getNodeParameter('content', i) as string;
			const options = prepareOptions(this.getNodeParameter('options', i, {}), guildId);

			// Fallback must not be an explicit `undefined`: n8n throws a UserError when a
			// parameter that was never set resolves to undefined
			const embeds = (this.getNodeParameter('embeds', i, {}) as IDataObject).values as
				| IDataObject[]
				| undefined;
			const files = (this.getNodeParameter('files', i, {}) as IDataObject).values as
				| IDataObject[]
				| undefined;

			const body: IDataObject = {
				content,
				...options,
			};

			if (embeds) {
				body.embeds = prepareEmbeds.call(this, embeds);
			}

			let channelId: string;

			if (sendTo === 'user') {
				const userId = this.getNodeParameter('userId', i, '', { extractValue: true }) as string;

				channelId = (
					(await discordApiRequest.call(this, 'POST', '/users/@me/channels', {
						recipient_id: userId,
					})) as unknown as IDataObject
				).id as string;

				if (!channelId) {
					throw new NodeOperationError(this.getNode(), 'Could not create a channel to send direct message to', {
						itemIndex: i,
					});
				}
			} else {
				channelId = this.getNodeParameter('channelId', i, '', { extractValue: true }) as string;
			}

			if (!channelId) {
				throw new NodeOperationError(this.getNode(), 'Channel ID is required', { itemIndex: i });
			}

			let response: IDataObject;

			if (files?.length) {
				const multiPartBody = await prepareMultiPartForm.call(this, files, body, i);
				response = await discordApiMultiPartRequest.call(
					this,
					'POST',
					`/channels/${channelId}/messages`,
					multiPartBody,
				);
			} else {
				response = await discordApiRequest.call(this, 'POST', `/channels/${channelId}/messages`, body);
			}

			returnData.push(
				...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), {
					itemData: { item: i },
				}),
			);
		} catch (error) {
			const err = parseApiError.call(this, error, i);

			if (this.continueOnFail()) {
				returnData.push(...prepareErrorData.call(this, err, i));
				continue;
			}

			throw err;
		}
	}

	return returnData;
}
