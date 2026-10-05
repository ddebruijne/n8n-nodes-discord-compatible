import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { getAuditLogReasonHeaders, parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { guildRLC, moderationReason, moderationReasonCustom, userRLC } from '../common.description';

const properties: INodeProperties[] = [
	guildRLC,
	userRLC,
	moderationReason,
	moderationReasonCustom,
];

const displayOptions = {
	show: {
		resource: ['member'],
		operation: ['unban'],
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
			const userId = this.getNodeParameter('userId', i, '', { extractValue: true }) as string;
			const headers = getAuditLogReasonHeaders.call(this, i);

			await discordApiRequest.call(
				this,
				'DELETE',
				`/guilds/${guildId}/bans/${userId}`,
				{},
				{},
				headers,
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
