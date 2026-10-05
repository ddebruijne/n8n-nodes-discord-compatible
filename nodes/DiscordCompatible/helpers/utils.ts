import FormData from 'form-data';
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { jsonParse, NodeOperationError } from 'n8n-workflow';

import { moderationReasonLabels } from '../actions/common.description';

export const createSimplifyFunction =
	(includedFields: string[]) =>
	(item: IDataObject): IDataObject => {
		const result: IDataObject = {};

		for (const field of includedFields) {
			if (item[field] === undefined) continue;
			result[field] = item[field];
		}

		return result;
	};

export function isEmpty(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === 'object') return Object.keys(value as IDataObject).length === 0;
	return false;
}

export function parseApiError(this: IExecuteFunctions, error: any, itemIndex = 0): Error {
	const errorData = error?.cause?.error ?? error?.error ?? error?.response?.data;

	const errorOptions: IDataObject = { itemIndex };

	if (errorData?.message) {
		errorOptions.message = errorData.message;
	}

	if (errorOptions.message === 'Cannot send an empty message') {
		errorOptions.description =
			'Something has to be sent to the channel, whether it is a message, an embed or a file';
	}

	return new NodeOperationError(this.getNode(), errorData ?? error, errorOptions);
}

export function prepareErrorData(this: IExecuteFunctions, error: any, i: number): INodeExecutionData[] {
	let description = error.description;

	try {
		description = JSON.parse(error.description as string);
	} catch (err) {}

	return this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray({ error: error.message, description }),
		{ itemData: { item: i } },
	);
}

// Builds the headers carrying the audit-log reason from the node's reason/reasonCustom parameters.
export function getAuditLogReasonHeaders(this: IExecuteFunctions, itemIndex: number): IDataObject {
	const reason = this.getNodeParameter('reason', itemIndex, '') as string;

	const text =
		reason === 'other'
			? (this.getNodeParameter('reasonCustom', itemIndex, '') as string)
			: moderationReasonLabels[reason];

	if (!text) return {};

	return { 'X-Audit-Log-Reason': encodeURIComponent(text) };
}

export function prepareOptions(options: IDataObject, guildId?: string): IDataObject {
	if (options.flags) {
		const flags = options.flags as string[];
		if (flags.length === 2) {
			options.flags = (1 << 2) + (1 << 12);
		} else if (flags.includes('SUPPRESS_EMBEDS')) {
			options.flags = 1 << 2;
		} else if (flags.includes('SUPPRESS_NOTIFICATIONS')) {
			options.flags = 1 << 12;
		}
	}

	if (options.message_reference) {
		options.message_reference = {
			message_id: options.message_reference,
			guild_id: guildId,
		};
	}

	return options;
}

export function prepareEmbeds(this: IExecuteFunctions, embeds: IDataObject[]): IDataObject[] {
	return embeds
		.map((embed) => {
			let embedReturnData: IDataObject = {};

			if (embed.inputMethod === 'json') {
				if (typeof embed.json === 'object') {
					embedReturnData = embed.json as IDataObject;
				}
				try {
					embedReturnData = jsonParse(embed.json as string);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), 'Not a valid JSON', error);
				}
			} else {
				delete embed.inputMethod;

				for (const key of Object.keys(embed)) {
					if (embed[key] !== '') {
						embedReturnData[key] = embed[key];
					}
				}
			}

			if (embedReturnData.author && typeof embedReturnData.author === 'string') {
				embedReturnData.author = { name: embedReturnData.author };
			}
			if (embedReturnData.color && typeof embedReturnData.color === 'string') {
				embedReturnData.color = parseInt(embedReturnData.color.replace('#', ''), 16);
			}
			if (embedReturnData.video) {
				embedReturnData.video = { url: embedReturnData.video, width: 1270, height: 720 };
			}
			if (embedReturnData.thumbnail) {
				embedReturnData.thumbnail = { url: embedReturnData.thumbnail };
			}
			if (embedReturnData.image) {
				embedReturnData.image = { url: embedReturnData.image };
			}

			return embedReturnData;
		})
		.filter((embed) => !isEmpty(embed));
}

const MIME_EXTENSIONS: IDataObject = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'text/plain': 'txt',
	'text/csv': 'csv',
	'application/json': 'json',
	'application/pdf': 'pdf',
	'application/zip': 'zip',
	'video/mp4': 'mp4',
	'audio/mpeg': 'mp3',
};

export function extensionFromMime(mimeType?: string): string | undefined {
	if (!mimeType) return undefined;
	return (MIME_EXTENSIONS[mimeType] as string) ?? mimeType.split('/')[1];
}

export async function prepareMultiPartForm(
	this: IExecuteFunctions,
	files: IDataObject[],
	jsonPayload: IDataObject,
	i: number,
): Promise<FormData> {
	const multiPartBody = new FormData();
	const attachments: IDataObject[] = [];
	const filesData: IDataObject[] = [];

	for (const [index, file] of files.entries()) {
		const binaryData = this.helpers.assertBinaryData(i, file.inputFieldName as string);

		if (!binaryData) {
			throw new NodeOperationError(
				this.getNode(),
				`Input item [${i}] does not contain binary data on property ${file.inputFieldName}`,
			);
		}

		let filename = (binaryData.fileName as string) ?? `file-${index}`;

		if (!filename.includes('.')) {
			if (binaryData.fileExtension) {
				filename += `.${binaryData.fileExtension}`;
			}
			const ext = extensionFromMime(binaryData.mimeType as string);
			if (ext) {
				filename += `.${ext}`;
			}
		}

		attachments.push({ id: index, filename });

		filesData.push({
			data: await this.helpers.getBinaryDataBuffer(i, file.inputFieldName as string),
			name: filename,
			mime: binaryData.mimeType,
		});
	}

	multiPartBody.append('payload_json', JSON.stringify({ ...jsonPayload, attachments }), {
		contentType: 'application/json',
	});

	for (const [index, binaryData] of filesData.entries()) {
		multiPartBody.append(`files[${index}]`, binaryData.data as Buffer, {
			contentType: binaryData.mime as string,
			filename: binaryData.name as string,
		});
	}

	return multiPartBody;
}
