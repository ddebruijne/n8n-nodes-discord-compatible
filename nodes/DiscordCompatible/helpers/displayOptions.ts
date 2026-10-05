import type { INodeProperties } from 'n8n-workflow';

/**
 * Merges `displayOptions` into every property of a group so operation files stay declarative.
 */
export function updateDisplayOptions(
	displayOptions: INodeProperties['displayOptions'],
	properties: INodeProperties[],
): INodeProperties[] {
	return properties.map((property) => {
		property.displayOptions = {
			show: displayOptions?.show,
			hide: displayOptions?.hide,
			...property.displayOptions,
		};

		if (property.options && Array.isArray(property.options)) {
			// nested fields of fixedCollection/collection keep their own displayOptions
		}

		return property;
	});
}
