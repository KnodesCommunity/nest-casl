const { resolve } = require( 'path' );

module.exports = {
	entryPoints: [
		'src/index.ts',
	],
	includes: './docs-source',
	validation: { invalidLink: true },
	out: 'docs',
	pluginPages: {
		source: 'docs-source',
		pages: [
			{ title: 'Guides', childrenDir: 'guide', children: [
				{ title: 'Getting started', source: 'getting-started.md' },
				{ title: 'Use with guards', source: 'use-with-guards.md' },
				{ title: 'Better type constraints', source: 'better-type-constraints.md' },
			] },
			{ title: 'Changelog', source: '../CHANGELOG.md' },
		],
	},
	pluginCodeBlocks: {
		source: resolve( __dirname, 'test/demo' ),
	},
	tsconfig: 'tsconfig.build.json',
};
