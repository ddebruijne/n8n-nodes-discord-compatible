import type { INodeProperties } from 'n8n-workflow';

import * as ban from './ban.operation';
import * as getAll from './getAll.operation';
import * as kick from './kick.operation';
import * as roleAdd from './roleAdd.operation';
import * as roleRemove from './roleRemove.operation';
import * as timeout from './timeout.operation';
import * as unban from './unban.operation';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['member'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many members of a server',
				action: 'Get many members',
			},
			{
				name: 'Add Role',
				value: 'roleAdd',
				description: 'Add a role to a member',
				action: 'Add a role to a member',
			},
			{
				name: 'Remove Role',
				value: 'roleRemove',
				description: 'Remove a role from a member',
				action: 'Remove a role from a member',
			},
			{
				name: 'Kick',
				value: 'kick',
				description: 'Kick a member from the server',
				action: 'Kick a member',
			},
			{
				name: 'Ban',
				value: 'ban',
				description: 'Ban a member from the server',
				action: 'Ban a member',
			},
			{
				name: 'Unban',
				value: 'unban',
				description: 'Unban a user from the server',
				action: 'Unban a user',
			},
			{
				name: 'Timeout',
				value: 'timeout',
				description: 'Time out a member',
				action: 'Time out a member',
			},
		],
		default: 'getAll',
	},
	...getAll.description,
	...roleAdd.description,
	...roleRemove.description,
	...kick.description,
	...ban.description,
	...unban.description,
	...timeout.description,
];

export { ban, getAll, kick, roleAdd, roleRemove, timeout, unban };
