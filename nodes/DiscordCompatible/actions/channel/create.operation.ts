import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { categoryRLC, guildRLC } from '../common.description';

const properties: INodeProperties[] = [
	guildRLC,
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'The name of the channel',
		placeholder: 'e.g. new-channel',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		default: '0',
		required: true,
		description: 'The type of channel to create',
		options: [
			{ name: 'Text', value: '0' },
			{ name: 'Voice', value: '2' },
			{ name: 'Category', value: '4' },
			{ name: 'Announcement', value: '5' },
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [
			{
				displayName: 'Age-Restricted (NSFW)',
				name: 'nsfw',
				type: 'boolean',
				default: false,
				description: 'Whether the channel is age-restricted',
			},
			{
				displayName: 'Bitrate',
				name: 'bitrate',
				type: 'number',
				default: 8000,
				description: 'The bitrate (in bits) of the voice channel',
			},
			{
				...categoryRLC,
				displayName: 'Parent Category',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'number',
				default: 0,
				description: 'The position of the channel in the server’s channel list',
			},
			{
				displayName: 'Rate Limit Per User',
				name: 'rate_limit_per_user',
				type: 'number',
				default: 0,
				description: 'Amount of seconds a user has to wait before sending another message (0-21600)',
			},
			{
				displayName: 'Topic',
				name: 'topic',
				type: 'string',
				default: '',
				description: 'The topic of the channel. Not applicable to voice or category channels.',
				placeholder: 'e.g. Channel for important announcements',
				typeOptions: {
					rows: 2,
				},
			},
			{
				displayName: 'User Limit',
				name: 'user_limit',
				type: 'number',
				default: 0,
				description: 'Maximum number of users that can be in the voice channel (0 for unlimited)',
			},
		],
	},
];

const displayOptions = {
	show: {
		resource: ['channel'],
		operation: ['create'],
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
			const name = this.getNodeParameter('name', i) as string;
			const type = this.getNodeParameter('type', i) as string;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (options.categoryId) {
				options.parent_id = (options.categoryId as IDataObject).value;
				delete options.categoryId;
			}

			const body: IDataObject = {
				name,
				type: parseInt(type, 10),
				...options,
			};

			const response = await discordApiRequest.call(
				this,
				'POST',
				`/guilds/${guildId}/channels`,
				body,
			);

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
