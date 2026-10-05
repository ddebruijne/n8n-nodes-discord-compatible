import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { getAuditLogReasonHeaders, parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import {
	banDeleteHistory,
	guildRLC,
	moderationReason,
	moderationReasonCustom,
	userRLC,
} from '../common.description';

const properties: INodeProperties[] = [
	guildRLC,
	userRLC,
	moderationReason,
	moderationReasonCustom,
	banDeleteHistory,
];

const displayOptions = {
	show: {
		resource: ['member'],
		operation: ['ban'],
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
			const deleteMessageSeconds = this.getNodeParameter('deleteMessageSeconds', i, 0) as number;
			const headers = getAuditLogReasonHeaders.call(this, i);

			const body: IDataObject = {};
			if (deleteMessageSeconds) {
				body.delete_message_seconds = deleteMessageSeconds;
			}

			await discordApiRequest.call(
				this,
				'PUT',
				`/guilds/${guildId}/bans/${userId}`,
				body,
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
