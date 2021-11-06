const { readFileSync, writeFileSync } = require( 'fs' );
const { resolve } = require( 'path' );

const { peerDependencies } = require( resolve( __dirname, '../../package.json' ) );

const README = resolve( __dirname, '../../README.md' );
const readmeText = readFileSync( README, 'utf-8' );
const peerDepsListMd = Object.entries( peerDependencies )
	.map( ( [ pkg, version ] ) => `* [${pkg}](https://www.npmjs.com/package/${pkg}): \`${version}\`` )
	.join( '\n' );
const peerDepsInstallMd = `\`\`\`sh
npm install ${Object.entries( peerDependencies )
		.map( ( [ pkg, version ] ) => `${pkg}@${version}` )
		.join( ' ' )}
\`\`\``;

writeFileSync(
	README,
	readmeText.replace( /(?<=<!-- PEER DEPS -->)(.|\n)*(?=<!-- END PEER DEPS -->)/m, `\n${peerDepsListMd}\n\n${peerDepsInstallMd}\n` ) );
