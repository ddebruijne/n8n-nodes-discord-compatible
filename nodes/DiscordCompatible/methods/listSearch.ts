import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { readResourceLocator } from '../helpers/resourceLocator';
import { discordApiRequest } from '../transport';
import {
	GUILD_ANNOUNCEMENT,
	GUILD_CATEGORY,
	GUILD_TEXT,
	GUILD_VOICE,
} from '../actions/common.description';

function buildResults(items: IDataObject[], query?: string): INodeListSearchResult['results'] {
	const search = (query ?? '').toLowerCase();

	return items
		.filter((item) => {
			if (!search) return true;
			return String(item.name ?? '').toLowerCase().includes(search);
		})
		.map((item) => ({
			name: String(item.name ?? item.id),
			value: String(item.id),
		}));
}

export async function guildSearch(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const guilds = (await discordApiRequest.call(this, 'GET', '/users/@me/guilds')) as unknown as IDataObject[];

	return { results: buildResults(Array.isArray(guilds) ? guilds : [], query) };
}

async function listGuildChannels(this: ILoadOptionsFunctions): Promise<IDataObject[]> {
	const guildId = readResourceLocator.call(this, 'guildId');

	if (!guildId) return [];

	const channels = (await discordApiRequest.call(
		this,
		'GET',
		`/guilds/${guildId}/channels`,
	)) as unknown as IDataObject[];

	return Array.isArray(channels) ? channels : [];
}

export async function channelSearch(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const channels = await listGuildChannels.call(this);
	return { results: buildResults(channels, query) };
}

export async function textChannelSearch(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const channels = await listGuildChannels.call(this);
	const textChannels = channels.filter(
		(channel) => channel.type === GUILD_TEXT || channel.type === GUILD_ANNOUNCEMENT,
	);

	return { results: buildResults(textChannels, query) };
}

export async function voiceChannelSearch(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const channels = await listGuildChannels.call(this);
	const voiceChannels = channels.filter((channel) => channel.type === GUILD_VOICE);

	return { results: buildResults(voiceChannels, query) };
}

export async function categorySearch(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const channels = await listGuildChannels.call(this);
	const categories = channels.filter((channel) => channel.type === GUILD_CATEGORY);

	return { results: buildResults(categories, query) };
}

function normalizeMembers(payload: unknown): IDataObject[] {
	if (Array.isArray(payload)) return payload as IDataObject[];

	const wrapped = payload as IDataObject;
	for (const key of ['members', 'results', 'items']) {
		if (Array.isArray(wrapped?.[key])) return wrapped[key] as IDataObject[];
	}

	return [];
}

function memberName(member: IDataObject): string {
	const user = (member.user ?? {}) as IDataObject;
	return String(
		member.nick ?? user.username ?? member.username ?? member.display_name ?? member.user_id ?? member.id ?? '',
	);
}

function memberId(member: IDataObject): string {
	const user = (member.user ?? {}) as IDataObject;
	return String(user.id ?? member.user_id ?? member.id ?? '');
}

export async function userSearch(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const guildId = readResourceLocator.call(this, 'guildId');

	if (!guildId) {
		return { results: [] };
	}

	const search = query ?? '';

	// Fluxer exposes POST /guilds/{id}/members-search, Discord exposes
	// GET /guilds/{id}/members/search; fall back to a paged member listing.
	try {
		const payload = await discordApiRequest.call(
			this,
			'POST',
			`/guilds/${guildId}/members-search`,
			{ query: search, limit: 25 },
		);
		const members = normalizeMembers(payload);
		if (members.length) {
			return {
				results: members.map((member) => ({ name: memberName(member), value: memberId(member) })),
			};
		}
	} catch (error) {}

	try {
		const payload = await discordApiRequest.call(
			this,
			'GET',
			`/guilds/${guildId}/members/search`,
			{},
			{ query: search, limit: 25 },
		);
		const members = normalizeMembers(payload);
		if (members.length) {
			return {
				results: members.map((member) => ({ name: memberName(member), value: memberId(member) })),
			};
		}
	} catch (error) {}

	const payload = await discordApiRequest.call(
		this,
		'GET',
		`/guilds/${guildId}/members`,
		{},
		{ limit: 100 },
	);
	const members = normalizeMembers(payload).filter((member) => {
		if (!search) return true;
		return memberName(member).toLowerCase().includes(search.toLowerCase());
	});

	return {
		results: members.map((member) => ({ name: memberName(member), value: memberId(member) })),
	};
}
