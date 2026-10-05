import type FormData from 'form-data';
import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const DEFAULT_BASE_URL = 'https://discord.com/api/v10';
export const DEFAULT_API_PATH = '/api';

const MAX_RATE_LIMIT_RETRIES = 3;
const MAX_RETRY_DELAY_MS = 10_000;

type RequestContext =
	| IExecuteFunctions
	| IExecuteSingleFunctions
	| IHookFunctions
	| ILoadOptionsFunctions;

export function getCredentialType(authentication: string): string {
	return authentication === 'webhook' ? 'discordCompatibleWebhookApi' : 'discordCompatibleApi';
}

/**
 * Resolves the API root from the credential, so the same node can talk to Discord,
 * a self-hosted Fluxer instance, or any other Discord-compatible server.
 *
 * Self-hosted servers are often documented by their site URL only, so a base URL
 * without any path (https://fluxer.example.com) gets the conventional /api suffix.
 */
export async function getBaseUrl(this: RequestContext): Promise<string> {
	const credentials = await this.getCredentials('discordCompatibleApi');
	const baseUrl = ((credentials.baseUrl as string) || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');

	try {
		const parsed = new URL(baseUrl);
		if (parsed.pathname === '/' || parsed.pathname === '') {
			return `${baseUrl}${DEFAULT_API_PATH}`;
		}
	} catch (error) {
		// Not a parseable absolute URL: use it as-is and let the request fail with a clear error
	}

	return baseUrl;
}

const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));

export async function requestApi(
	this: RequestContext,
	options: IHttpRequestOptions,
	credentialType: string,
	attempt = 0,
): Promise<IDataObject> {
	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			credentialType,
			options,
		);

		if (response === undefined || response === null || response === '') {
			return { success: true };
		}

		return response as IDataObject;
	} catch (error) {
		const statusCode = Number(
			(error as IDataObject)?.httpCode ?? (error as IDataObject)?.statusCode ?? 0,
		);

		// Discord-compatible APIs answer 429 with a retry-after hint; back off and retry
		if (statusCode === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
			await sleep(Math.min(2 ** attempt * 1000, MAX_RETRY_DELAY_MS));
			return await requestApi.call(this, options, credentialType, attempt + 1);
		}

		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function discordApiRequest(
	this: RequestContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	headers: IDataObject = {},
): Promise<IDataObject> {
	const authentication = this.getNodeParameter('authentication', 0, 'botToken') as string;
	const credentialType = getCredentialType(authentication);

	const options: IHttpRequestOptions = {
		method,
		url: '',
		headers,
		qs,
		body,
		json: true,
	};

	if (credentialType === 'discordCompatibleWebhookApi') {
		const credentials = await this.getCredentials('discordCompatibleWebhookApi');
		options.url = (credentials.webhookUri as string) + endpoint;
	} else {
		options.url = `${await getBaseUrl.call(this)}${endpoint}`;
	}

	return await requestApi.call(this, options, credentialType);
}

export async function discordApiMultiPartRequest(
	this: RequestContext,
	method: IHttpRequestMethods,
	endpoint: string,
	formData: FormData,
): Promise<IDataObject> {
	const authentication = this.getNodeParameter('authentication', 0, 'botToken') as string;
	const credentialType = getCredentialType(authentication);

	const options: IHttpRequestOptions = {
		method,
		url: '',
		headers: { ...formData.getHeaders() },
		body: formData as unknown as IHttpRequestOptions['body'],
	};

	if (credentialType === 'discordCompatibleWebhookApi') {
		const credentials = await this.getCredentials('discordCompatibleWebhookApi');
		options.url = (credentials.webhookUri as string) + endpoint;
	} else {
		options.url = `${await getBaseUrl.call(this)}${endpoint}`;
	}

	return await requestApi.call(this, options, credentialType);
}
