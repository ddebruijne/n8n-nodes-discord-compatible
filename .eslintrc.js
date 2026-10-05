module.exports = {
	root: true,
	env: { node: true, es2021: true },
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module',
		project: ['./tsconfig.json'],
	},
	ignorePatterns: ['.eslintrc.js', 'dist/**', 'node_modules/**', 'scripts/**'],
	plugins: ['n8n-nodes-base'],
	extends: ['plugin:n8n-nodes-base/community'],
	rules: {
		// Alphabetical option ordering is cosmetic; the option sets here mirror the built-in Discord node
		'n8n-nodes-base/node-param-options-type-unsorted-items': 'off',
		// The camelCase variant of this rule targets nodes in the n8n main repository
		'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
	},
	overrides: [
		{
			files: ['nodes/**/*.ts'],
			extends: ['plugin:n8n-nodes-base/nodes'],
			rules: {
				'n8n-nodes-base/node-param-options-type-unsorted-items': 'off',
				// Resource-locator mode objects take no `default` in current n8n-workflow typings
				'n8n-nodes-base/node-param-default-missing': 'off',
			},
		},
		{
			files: ['credentials/**/*.ts'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				// The camelCase variant of this rule only targets credentials in the n8n main repository
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
	],
};
