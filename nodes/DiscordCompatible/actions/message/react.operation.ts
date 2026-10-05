import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { channelRLC, messageIdString } from '../common.description';

const properties: INodeProperties[] = [
	channelRLC,
	messageIdString,
	{
		displayName: 'Emoji',
		name: 'emoji',
		type: 'string',
		default: '',
		required: true,
		description: 'The emoji to react with. Use the unicode character (e.g. 👍) or "name:ID" for custom emojis.',
		placeholder: 'e.g. 👍',
	},
];

const displayOptions = {
	show: {
		resource: ['message'],
		operation: ['react'],
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
			const messageId = this.getNodeParameter('messageId', i) as string;
			const emoji = this.getNodeParameter('emoji', i) as string;

			await discordApiRequest.call(
				this,
				'PUT',
				`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
			);

			returnData.push(
				...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray({ success: true }), {
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
