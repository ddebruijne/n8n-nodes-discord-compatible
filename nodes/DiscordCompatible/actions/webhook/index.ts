import type { INodeProperties } from 'n8n-workflow';

import * as sendLegacy from './sendLegacy.operation';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				authentication: ['webhook'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'sendLegacy',
				description: 'Send a message to a webhook',
				action: 'Send a message to a webhook',
			},
		],
		default: 'sendLegacy',
	},
	...sendLegacy.description,
];

export { sendLegacy };
