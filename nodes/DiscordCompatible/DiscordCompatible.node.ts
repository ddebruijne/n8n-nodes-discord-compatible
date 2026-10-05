import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOutput,
} from 'n8n-workflow';

import { router } from './actions/router';
import { versionDescription } from './actions/versionDescription';
import { loadOptions, listSearch } from './methods';

export class DiscordCompatible implements INodeType {
	description: INodeTypeDescription = versionDescription;

	methods = {
		listSearch,
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<NodeOutput> {
		return await router.call(this);
	}
}
