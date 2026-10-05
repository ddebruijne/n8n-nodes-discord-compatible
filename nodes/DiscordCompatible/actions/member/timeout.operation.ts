import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { getAuditLogReasonHeaders, parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import {
	guildRLC,
	moderationReason,
	moderationReasonCustom,
	timeoutDuration,
	userRLC,
} from '../common.description';

const properties: INodeProperties[] = [
	guildRLC,
	userRLC,
	timeoutDuration,
	moderationReason,
	moderationReasonCustom,
];

const displayOptions = {
	show: {
		resource: ['member'],
		operation: ['timeout'],
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
			const duration = this.getNodeParameter('duration', i, 3600) as number | 'remove';
			const headers = getAuditLogReasonHeaders.call(this, i);

			const body: IDataObject = {
				communication_disabled_until:
					duration === 'remove' ? null : new Date(Date.now() + duration * 1000).toISOString(),
			};

			const response = await discordApiRequest.call(
				this,
				'PATCH',
				`/guilds/${guildId}/members/${userId}`,
				body,
				{},
				headers,
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
