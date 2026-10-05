import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { guildRLC, roleMultiOptions, userRLC } from '../common.description';

const properties: INodeProperties[] = [guildRLC, userRLC, roleMultiOptions];

const displayOptions = {
	show: {
		resource: ['member'],
		operation: ['roleAdd'],
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
			const roles = this.getNodeParameter('role', i, []) as string[];

			for (const roleId of roles) {
				await discordApiRequest.call(
					this,
					'PUT',
					`/guilds/${guildId}/members/${userId}/roles/${roleId}`,
				);
			}

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
