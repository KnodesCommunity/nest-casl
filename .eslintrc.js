const { resolve } = require( 'path' );

module.exports = {
	root: true,
	extends: '@scitizen/eslint-config/nest',
	parserOptions: {
		project: [ './tsconfig.build.json', './tsconfig.spec.json', './tsconfig.e2e-spec.json' ]
			.map( tsconfig => resolve( __dirname, tsconfig ) ),
	},
	rules: {
		'jsdoc/check-tag-names': [ 'error', {
			definedTags: [ 'category' ],
		} ],
	},
};
