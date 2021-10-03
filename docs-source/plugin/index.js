const { Application, ParameterType } = require( 'typedoc' );

const { options, pluginName } = require( './constants' );
const { CustomPlugin } = require( './code-block-plugin' );

/**
 *
 * @param {Application} app
 */
module.exports.load = app => {
	app.options.addDeclaration( {
		name: options.directories,
		help: 'A map of base directories where to extract code blocks',
		type: ParameterType.Mixed,
		validate: obj => {
			if(
				typeof obj !== 'object' ||
				Object.entries( obj ).some( ( [ k, v ] ) => !k.match( /^\w+$/ ) || typeof v !== 'string' || !v.startsWith( '.' ) ) ){
				throw new TypeError( 'Invalid option' );
			}
		},
	} );

	app.renderer.addComponent( pluginName, new CustomPlugin( app.renderer ) );
	// app.renderer.pl
};
