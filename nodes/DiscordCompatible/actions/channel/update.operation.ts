import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { categoryRLC, channelRLC } from '../common.description';

const properties: INodeProperties[] = [
	channelRLC,
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'The new name of the channel',
		placeholder: 'e.g. new-channel-name',
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
				description: 'The new topic of the channel',
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
		operation: ['update'],
	},
	hide: {
		authentication: ['webhook'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	_guildId: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const items = this.getInputData();

	for (let i = 0; i < items.length; i++) {
		try {
			const channelId = this.getNodeParameter('channelId', i, '', { extractValue: true }) as string;
			const name = this.getNodeParameter('name', i, '') as string;
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			if (options.categoryId) {
				options.parent_id = (options.categoryId as IDataObject).value;
				delete options.categoryId;
			}

			const body: IDataObject = {
				...options,
			};

			if (name) {
				body.name = name;
			}

			const response = await discordApiRequest.call(this, 'PATCH', `/channels/${channelId}`, body);

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
