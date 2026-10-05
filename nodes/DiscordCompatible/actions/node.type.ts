import type { AllEntities } from 'n8n-workflow';

type NodeMap = {
	channel: 'get' | 'getAll' | 'create' | 'update' | 'deleteChannel';
	message: 'deleteMessage' | 'getAll' | 'get' | 'react' | 'send';
	member: 'ban' | 'getAll' | 'kick' | 'roleAdd' | 'roleRemove' | 'timeout' | 'unban';
	webhook: 'sendLegacy';
};

export type DiscordCompatible = AllEntities<NodeMap>;
