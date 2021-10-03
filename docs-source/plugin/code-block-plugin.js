const {resolve, extname, relative} = require('path');
const {readFileSync} = require('fs');
const {chunk} = require('lodash');
const Marked = require( "marked" );
const { Component, RendererComponent } = require( 'typedoc/dist/lib/output/components' );
const { MarkdownEvent, PageEvent, RendererEvent } = require( 'typedoc/dist/lib/output/events' );

const { options } = require( './constants' );

const REGION_REGEX = /^\s*\/\/\s*#((?:end)?region)\s*(.*?)?$/gm;

/**
 * Pages plugin for integrating your own pages into documentation output
 */

class CodeBlockPlugin extends RendererComponent {
	/**
	 * @type {Map<string, Map<string, {code: string, startLine: number, endLine: number}>>}
	 */
	fileSamples = new Map();
	get directories() {
		return this.application.options.getValue(options.directories);
	}
	
	/**
	 *
	 */
	initialize() {
		this.listenTo( this.owner, {
			[MarkdownEvent.PARSE]: this._parseMarkdownEventHandler,
		} );
	}

	/**
	 * @param {MarkdownEvent} event
	 */
	_parseMarkdownEventHandler( event ) {
		event.parsedText = event.parsedText.replace(
            /\{@codeblock (.+?)#(.+?)(?:\s*\|\s*(.*?))?\}/, (_fullmatch, file, block, fakedFileName) => this._handleCodeBlock(file, block, fakedFileName))
	}

	_resolveFile(file){
		const [dir, ...path] = file.split('/');
		if(!(dir in this.directories)){
			throw new Error(`Trying to use code block from named directory ${dir} (targetting file ${file}), but it is not defined.`);
		}
		const newPath = resolve(this.application.options.getValue('options'), this.directories[dir], ...path);
		return newPath;
	}

	_handleCodeBlock(file, block, fakedFileName){
		const resolvedFile = this._resolveFile(file);
		if(!this.fileSamples.has(resolvedFile)){
			this.fileSamples.set(resolvedFile, this._readCodeFile(resolvedFile))
		}
		const fileSample = this.fileSamples.get(resolvedFile);
		const codeSample = fileSample?.get(block);
		if(!codeSample){
			throw new Error(`Missing block ${block} in ${resolvedFile}`);
		}

		const gitHubComponent = this.application.converter.getComponent('git-hub');
		const repository = gitHubComponent.getRepository(resolvedFile);
		const url = repository.getGitHubURL(resolvedFile);
		const headerFileName = `${fakedFileName ?? relative(this.application.options.getValue('options'), resolvedFile)}#${codeSample.startLine}~${codeSample.endLine}`;
		const header = Marked(`From ${url ? `[./${headerFileName}](${url}#L${codeSample.startLine}-L${codeSample.endLine})` : `./${headerFileName}`}`);


		const codeHighlighted = Marked.defaults.renderer.code(codeSample.code, extname(resolvedFile).slice(1));
		return Marked.defaults.renderer.blockquote(header + codeHighlighted);
		//this.owner.getComponent('marked').getHighlighted(codeSample, extname(resolvedFile).slice(1));
	}

	_readCodeFile(file) {
		const content = readFileSync(file, 'utf-8');
		const regionMarkers = [...content.matchAll(REGION_REGEX)];
		regionMarkers.forEach((m, i, arr) => {
			if(
				(i % 2 === 0 && m[1] !== 'region') ||
				i % 2 === 1 && (m[1] !== 'endregion' || m[2] && arr[i-1][2] !== m[2])
			){
				throw new SyntaxError('Invalid regions');
			}
		})
		const regions = chunk(regionMarkers, 2)
			.reduce((acc, [start, end]) => {
				const block = content
					.slice(start.index + start[0].length, end.index)
					.trim();
				const blockStart = content.indexOf(block);
				acc.set(start[2], {
					code: block,
					startLine: content.substring(0, blockStart).split('\n').length,
					endLine: content.substring(blockStart + block.length - 1).split('\n').length,
				});
				return acc;
			}, new Map());
		return regions;
	}
}
module.exports.CustomPlugin = Component( { name: module.exports.PLUGIN_NAME } )( CodeBlockPlugin ) ?? CodeBlockPlugin;
