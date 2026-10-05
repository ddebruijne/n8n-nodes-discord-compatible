import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { createSimplifyFunction, parseApiError, prepareErrorData } from '../../helpers/utils';
import { discordApiRequest } from '../../transport';
import { guildRLC, returnAllOrLimit, simplifyBoolean } from '../common.description';

const properties: INodeProperties[] = [
	guildRLC,
	...returnAllOrLimit,
	{
		displayName: 'After',
		name: 'after',
		type: 'string',
		default: '',
		description: 'The ID of the user after which to start listing members',
		placeholder: 'e.g. 786953432728469534',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [
			{
				...simplifyBoolean,
				displayName: 'Simplify',
			},
		],
	},
];

const displayOptions = {
	show: {
		resource: ['member'],
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
	const simplifyResponse = createSimplifyFunction([
		'user',
		'nick',
		'roles',
		'joined_at',
	]);

	const returnAll = this.getNodeParameter('returnAll', 0, false) as boolean;
	const after = this.getNodeParameter('after', 0, '') as string;

	const qs: IDataObject = {};

	if (after) {
		qs.after = after;
	}

	const simplify = this.getNodeParameter('options.simplify', 0, false) as boolean;

	try {
		let response: IDataObject[] = [];

		if (!returnAll) {
			qs.limit = this.getNodeParameter('limit', 0, 50);
			const page = await discordApiRequest.call(this, 'GET', `/guilds/${guildId}/members`, {}, qs);
			response = (Array.isArray(page) ? page : [page]) as IDataObject[];
		} else {
			let responseData: IDataObject[] = [];
			qs.limit = 100;

			do {
				const page = await discordApiRequest.call(
					this,
					'GET',
					`/guilds/${guildId}/members`,
					{},
					qs,
				);
				responseData = (Array.isArray(page) ? page : [page]) as IDataObject[];
				if (!responseData.length) break;
				response.push(...responseData);

				// Discord carries the member id at the top level, Fluxer nests it under user.id
				const lastMember = responseData[responseData.length - 1];
				const cursor = (lastMember.id ?? (lastMember.user as IDataObject)?.id) as string | undefined;

				// A missing or unchanged cursor would refetch the same page forever
				if (!cursor || cursor === qs.after) break;
				qs.after = cursor;
			} while (responseData.length);
		}

		if (simplify) {
			response = response.map(simplifyResponse);
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
