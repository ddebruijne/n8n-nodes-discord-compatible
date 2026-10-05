import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import {
	parseApiError,
	prepareEmbeds,
	prepareErrorData,
	prepareMultiPartForm,
	prepareOptions,
} from '../../helpers/utils';
import { discordApiMultiPartRequest, discordApiRequest } from '../../transport';
import { embedsFixedCollection, filesFixedCollection } from '../common.description';

const properties: INodeProperties[] = [
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
				displayName: 'Avatar URL',
				name: 'avatar_url',
				type: 'string',
				default: '',
				description: 'Override the default avatar of the webhook',
				placeholder: 'e.g. https://example.com/image.png',
			},
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
				displayName: 'Text-to-Speech (TTS)',
				name: 'tts',
				type: 'boolean',
				default: false,
				description: 'Whether to have the message read out loud in the channel',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				description: 'Override the default username of the webhook',
				placeholder: 'e.g. My Bot',
			},
			{
				displayName: 'Wait for Completion',
				name: 'wait',
				type: 'boolean',
				default: false,
				description: 'Whether to wait for the message to be created and return its data',
			},
		],
	},
	embedsFixedCollection,
	filesFixedCollection,
];

const displayOptions = {
	show: {
		authentication: ['webhook'],
		operation: ['sendLegacy'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const items = this.getInputData();

	for (let i = 0; i < items.length; i++) {
		try {
			const content = this.getNodeParameter('content', i) as string;
			const options = prepareOptions(this.getNodeParameter('options', i, {}));

			// Fallback must not be an explicit `undefined`: n8n throws a UserError when a
			// parameter that was never set resolves to undefined
			const embeds = (this.getNodeParameter('embeds', i, {}) as IDataObject).values as
				| IDataObject[]
				| undefined;
			const files = (this.getNodeParameter('files', i, {}) as IDataObject).values as
				| IDataObject[]
				| undefined;

			let qs: IDataObject | undefined = undefined;

			if (options.wait) {
				qs = { wait: options.wait };
				delete options.wait;
			}

			const body: IDataObject = {
				content,
				...options,
			};

			if (embeds) {
				body.embeds = prepareEmbeds.call(this, embeds);
			}

			let response: IDataObject;

			if (files?.length) {
				const multiPartBody = await prepareMultiPartForm.call(this, files, body, i);
				response = await discordApiMultiPartRequest.call(this, 'POST', '', multiPartBody);
			} else {
				response = await discordApiRequest.call(this, 'POST', '', body, qs);
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
