module.exports = {
	extends: '@scitizen/eslint-config/nest',
	parserOptions: {
		project: [ 'tsconfig.json', 'tsconfig.spec.json', 'tsconfig.spec.e2e.json' ],
	},
};
