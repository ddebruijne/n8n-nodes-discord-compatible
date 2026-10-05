import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { discordApiRequest } from '../transport';
import type { DiscordCompatible } from './node.type';
import * as channel from './channel';
import * as member from './member';
import * as message from './message';
import * as webhook from './webhook';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	let returnData: INodeExecutionData[] = [];

	let resource = 'webhook';
	// The resource parameter is hidden when the connection type is webhook
	try {
		resource = this.getNodeParameter('resource', 0) as string;
	} catch (error) {}

	const operation = this.getNodeParameter('operation', 0) as string;

	let guildId = '';
	if (resource !== 'webhook') {
		guildId = this.getNodeParameter('guildId', 0, '', { extractValue: true }) as string;
	}

	const discord = { resource, operation } as DiscordCompatible;

	switch (discord.resource) {
		case 'channel':
			returnData = await channel[discord.operation].execute.call(this, guildId);
			break;
		case 'message':
			returnData = await message[discord.operation].execute.call(this, guildId);
			break;
		case 'member':
			returnData = await member[discord.operation].execute.call(this, guildId);
			break;
		case 'webhook':
			returnData = await webhook[discord.operation].execute.call(this);
			break;
		default:
			throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known`);
	}

	return [returnData];
}

export { discordApiRequest, IDataObject };
