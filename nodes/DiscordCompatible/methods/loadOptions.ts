import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { readResourceLocator } from '../helpers/resourceLocator';
import { discordApiRequest } from '../transport';

export async function getRoles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const guildId = readResourceLocator.call(this, 'guildId');

	if (!guildId) return [];

	const roles = (await discordApiRequest.call(
		this,
		'GET',
		`/guilds/${guildId}/roles`,
	)) as unknown as IDataObject[];

	if (!Array.isArray(roles)) return [];

	return roles.map((role) => ({
		name: String(role.name ?? role.id),
		value: String(role.id),
	}));
}
