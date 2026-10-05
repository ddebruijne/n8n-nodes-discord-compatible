import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { createSimplifyFunction, parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { channelRLC, returnAllOrLimit, simplifyBoolean } from '../common.description';

const properties: INodeProperties[] = [
	channelRLC,
	...returnAllOrLimit,
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [simplifyBoolean],
	},
];

const displayOptions = {
	show: {
		resource: ['message'],
		operation: ['getAll'],
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
	const simplifyResponse = createSimplifyFunction([
		'id',
		'channel_id',
		'author',
		'content',
		'timestamp',
		'type',
	]);

	for (let i = 0; i < items.length; i++) {
		try {
			const channelId = this.getNodeParameter('channelId', i, '', { extractValue: true }) as string;
			const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

			const qs: IDataObject = {};
			let response: IDataObject[] = [];

			if (!returnAll) {
				qs.limit = this.getNodeParameter('limit', i, 50);
				const page = await discordApiRequest.call(
					this,
					'GET',
					`/channels/${channelId}/messages`,
					undefined,
					qs,
				);
				response = (Array.isArray(page) ? page : [page]) as IDataObject[];
			} else {
				let responseData: IDataObject[] = [];
				qs.limit = 100;

				do {
					const page = await discordApiRequest.call(
						this,
						'GET',
						`/channels/${channelId}/messages`,
						undefined,
						qs,
					);
					responseData = (Array.isArray(page) ? page : [page]) as IDataObject[];
					if (!responseData.length) break;
					qs.before = responseData[responseData.length - 1].id as string;
					response.push(...responseData);
				} while (responseData.length);
			}

			const simplify = this.getNodeParameter('options.simplify', i, false) as boolean;

			if (simplify) {
				response = response.map(simplifyResponse);
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
