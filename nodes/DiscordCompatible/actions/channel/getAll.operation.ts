import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import {
	GUILD_ANNOUNCEMENT,
	GUILD_CATEGORY,
	GUILD_TEXT,
	GUILD_VOICE,
	guildRLC,
	returnAllOrLimit,
} from '../common.description';

const properties: INodeProperties[] = [
	guildRLC,
	...returnAllOrLimit,
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [
			{
				displayName: 'Filter by Type',
				name: 'filter',
				type: 'multiOptions',
				default: [],
				description: 'Only return channels of the selected types',
				options: [
					{ name: 'Text', value: GUILD_TEXT },
					{ name: 'Voice', value: GUILD_VOICE },
					{ name: 'Category', value: GUILD_CATEGORY },
					{ name: 'Announcement', value: GUILD_ANNOUNCEMENT },
				],
			},
		],
	},
];

const displayOptions = {
	show: {
		resource: ['channel'],
		operation: ['getAll'],
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

	try {
		const returnAll = this.getNodeParameter('returnAll', 0, false) as boolean;

		const fetched = await discordApiRequest.call(this, 'GET', `/guilds/${guildId}/channels`);
		let response = (Array.isArray(fetched) ? fetched : [fetched]) as IDataObject[];

		if (!returnAll) {
			const limit = this.getNodeParameter('limit', 0, 50) as number;
			response = response.slice(0, limit);
		}

		const options = this.getNodeParameter('options', 0, {}) as IDataObject;

		if (options.filter) {
			const filter = options.filter as number[];
			response = response.filter((item) => filter.includes(item.type as number));
		}

		returnData.push(
			...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), {
				itemData: { item: 0 },
			}),
		);
	} catch (error) {
		const err = parseApiError.call(this, error, 0);

		if (this.continueOnFail()) {
			returnData.push(...prepareErrorData.call(this, err, 0));
			return returnData;
		}

		throw err;
	}

	return returnData;
}
