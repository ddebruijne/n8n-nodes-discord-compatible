import type { ILoadOptionsFunctions } from 'n8n-workflow';

/** Resource locators may hand back either the extracted value or the raw {mode, value} object */
export function readResourceLocator(this: ILoadOptionsFunctions, parameterName: string): string {
	const value = this.getNodeParameter(parameterName, 0) as string | { value?: string };

	if (value && typeof value === 'object') {
		return (value.value as string) ?? '';
	}

	return (value as string) ?? '';
}
