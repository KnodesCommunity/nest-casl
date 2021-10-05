const {resolve, extname, relative} = require('path');
const {readFileSync} = require('fs');
const {chunk} = require('lodash');
const Marked = require( "marked" );
const { Component, RendererComponent } = require( 'typedoc/dist/lib/output/components' );
const { MarkdownEvent, PageEvent, RendererEvent } = require( 'typedoc/dist/lib/output/events' );

const { options } = require( './constants' );

const REGION_REGEX = /^[\t ]*\/\/[\t ]*#((?:end)?region)[\t ]*(.*?)?$/gm;
const DEFAULT_BLOCK_NAME = '__DEFAULT__'

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
		const originalText = event.parsedText;
		const regexExtract = /\{@codeblock\s+(?:(foldable|folded)\s+)?(.+?)(?:#(.+?))?(?:\s*\|\s*(.*?))?\}/;
		const regex = new RegExp(regexExtract.toString().slice(1, -1), 'g');
		event.parsedText = originalText.replace(
			regex,
			fullmatch => {
				const [, foldable, file, block, fakedFileName] = fullmatch.match(regexExtract);
				return this._handleCodeBlock(file, block, fakedFileName, foldable)
			})
		if(event.parsedText !== originalText){
			event.parsedText = `<style>
.code-block {
	tab-size: 4;
}

details.code-block summary {
	cursor: pointer;
}
details.code-block summary::before {
	content: '';
	border: 0.5em solid transparent;
	height: 0;
	width: 0;
	display: inline-block;
	border-left-color: currentColor;
	float: left;
	margin-right: 0.5em
}
details.code-block[open] summary::before {
	border-left-color: transparent;
	border-top-color: currentColor;
	margin-top: 0.25em
}
</style>` + event.parsedText
		}
	}

	_resolveFile(file){
		const [dir, ...path] = file.split('/');
		if(!(dir in this.directories)){
			throw new Error(`Trying to use code block from named directory ${dir} (targetting file ${file}), but it is not defined.`);
		}
		const newPath = resolve(this.application.options.getValue('options'), this.directories[dir], ...path);
		return newPath;
	}

	_handleCodeBlock(file, block, fakedFileName, foldable){
		// Use ??= once on node>14
		block = block ?? DEFAULT_BLOCK_NAME;
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
		const headerFileName = fakedFileName ?? `${relative(this.application.options.getValue('options'), resolvedFile)}#${codeSample.startLine}~${codeSample.endLine}`;
		const header = Marked(`From ${url ? `[./${headerFileName}](${url}#L${codeSample.startLine}-L${codeSample.endLine})` : `./${headerFileName}`}`)
			.replace(/^<p>/, '<p style="margin-bottom: 0;">');

		const codeHighlighted = Marked.defaults.renderer.code(codeSample.code, extname(resolvedFile).slice(1));
		return this._handleFoldCodeBlock(header, codeHighlighted, foldable);
		//this.owner.getComponent('marked').getHighlighted(codeSample, extname(resolvedFile).slice(1));
	}

	_handleFoldCodeBlock(header, code, foldable) {
		switch(foldable){
			case undefined: {
				return `<div class="code-block">${header}${code}</div>`;
			}

			case 'foldable': {
				return `<details class="code-block" open="open"><summary>${header}</summary>${code}</details>`;
			}

			case 'folded': {
				return `<details class="code-block"><summary>${header}</summary>${code}</details>`;
			}

			default: {
				throw new Error('Invalid foldable marker')
			}
		}
	}

	_readCodeFile(file) {
		const content = readFileSync(file, 'utf-8');
		const regionMarkers = [...content.matchAll(REGION_REGEX)];

		if(regionMarkers.length % 2 === 1) {
			throw new SyntaxError('Invalid regions');
		}
		if(regionMarkers.length === 0){
			return new Map([
				[DEFAULT_BLOCK_NAME, this._extractBlockInfos(content, 0)]
			]);
		}

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
				acc.set(start[2], this._extractBlockInfos(content, start.index + start[0].length, end.index));
				return acc;
			}, new Map());
		return regions;
	}

	/**
	 * 
	 * @param {string} content 
	 * @param {number} start 
	 * @param {number} end 
	 * @returns 
	 */
	_extractBlockInfos(content, start, end){
		const block = content
			.slice(start, end)
			.trim();
		const blockStart = content.indexOf(block);
		return {
			code: block,
			startLine: content.substring(0, blockStart).split('\n').length,
			endLine: content.substring(0, blockStart + block.length - 1).split('\n').length,
		};
	}
}
module.exports.CustomPlugin = Component( { name: module.exports.PLUGIN_NAME } )( CodeBlockPlugin ) ?? CodeBlockPlugin;
