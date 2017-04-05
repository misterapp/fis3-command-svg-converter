/**
 * refer to grunt-webfont: common stuff
 *
 * @author Artem Sapegin (http://sapegin.me)
 */

var path = require('path');
var glob = require('glob');

var exports = {};

/**
 * Unicode Private Use Area start.
 * http://en.wikipedia.org/wiki/Private_Use_(Unicode)
 * @type {Number}
 */
exports.UNICODE_PUA_START = 0xF101;

/**
 * @font-face’s src values generation rules.
 * @type {Object}
 */
exports.fontsSrcsMap = {
	eot: [
		{
			ext: '.eot',
			src:'url({uri})'
		},
		{
			ext: '.eot?#iefix',
			format: 'embedded-opentype',
            src:'url({uri}) format("embedded-opentype")'
		}
	],
	woff: [
		{
			ext: '.woff',
			format: 'woff',
            src:'url({uri}) format("woff")',
			embeddable: true
		}
	],
	woff2: [
		{
			ext: '.woff2',
			format: 'woff2',
            src:'url({uri}) format("woff2")',
			embeddable: true
		}
	],
	ttf: [
		{
			ext: '.ttf',
			format: 'truetype',
            src:'url({uri}) format("truetype")',
			embeddable: true
		}
	],
	svg: [
		{
			ext: '.svg#{fontName}',
            src:'url({uri}) format("svg")',
			format: 'svg'
		}
	]
};
/**
 * CSS fileaname prefixes: _icons.scss.
 * @type {Object}
 */
exports.cssFilePrefixes = {
	_default: '',
	sass: '_',
	scss: '_'
};

/**
 * @font-face’s src parts seperators.
 * @type {Object}
 */
exports.fontSrcSeparators = {
	_default: ',\n\t\t',
	styl: ', '
};

/**
 * List of available font formats.
 * @type {String}
 */
exports.fontFormats = 'eot,woff,ttf,svg';

/**
 * Returns list of all generated font files.
 *
 * @param {Object} o Options.
 * @return {Array}
 */
exports.generatedFontFiles = function(o) {
 	var mask = '*.{' + o.types + '}';
	return glob.sync(path.join(o.dest, o.fontName + mask));
};

/**
 * Returns path to font of specified format.
 *
 * @param {Object} o Options.
 * @param {String} type Font type (see `wf.fontFormats`).
 * @return {String}
 */
exports.getFontPath = function(o, type) {
	return path.join(o.dest, o.fontName + '.' + type);
};

// Expose
module.exports = exports;
