const { resolve } = require( 'path' );

module.exports = {
	root: true,
	extends: '@knodes/eslint-config/nest',
	parserOptions: {
		project: [ './tsconfig.src.json', './tsconfig.spec.json', './tsconfig.e2e-spec.json' ]
			.map( tsconfig => resolve( __dirname, tsconfig ) ),
	},
	rules: {
		'jsdoc/check-tag-names': [ 'error', {
			definedTags: [ 'category' ],
		} ],
	},
};
