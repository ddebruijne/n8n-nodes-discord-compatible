import type { INodeProperties } from 'n8n-workflow';

import * as deleteMessage from './deleteMessage.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as react from './react.operation';
import * as send from './send.operation';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				description: 'Send a message to a channel or user',
				action: 'Send a message',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a message',
				action: 'Get a message',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many messages in a channel',
				action: 'Get many messages',
			},
			{
				name: 'Delete',
				value: 'deleteMessage',
				description: 'Delete a message',
				action: 'Delete a message',
			},
			{
				name: 'React',
				value: 'react',
				description: 'Add a reaction to a message',
				action: 'React to a message',
			},
		],
		default: 'send',
	},
	...send.description,
	...get.description,
	...getAll.description,
	...deleteMessage.description,
	...react.description,
];

export { deleteMessage, get, getAll, react, send };
