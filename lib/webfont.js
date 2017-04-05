/**
 * refer to grunt-webfont: webfont
 *
 * @author misterapp (https://github.com/misterapp)
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var glob = require('glob');
var _ = require('lodash');
var _s = require('underscore.string');
var mkdirp = require('mkdirp');
var del = require('del');
var engine = require('./engines/node');
var wf = require('./util/util');


module.exports.generateFonts = function (settings) {
    var options = {
        src: settings.src,// string or reg, see https://www.npmjs.com/package/glob
        dest: settings.dest,// destination path,must be string
        destStyleFile: settings.destStyleFile,// destination style file path（.css,.less,.sass）
        stylesheet: [path.extname(settings.destStyleFile).split('.')[1]],
        classPrefix: settings.classPrefix || 'icon-',
        fontName: settings.fontName || "icons",//all the font file name
        types: optionToArray(settings.types) || ['eot', 'woff', 'ttf', 'svg'],//Array or  String, default 'eot,woff,ttf,svg'
        order: optionToArray(settings.order) || ['eot', 'woff', 'ttf', 'svg'],//Array or  String, the order of font-face src，default 'eot,woff,ttf,svg'
        embed: settings.embed === true,// if need convert to data:uri
        fontHeight: settings.fontHeight || 512,
        startCodepoint: settings.startCodepoint || wf.UNICODE_PUA_START,
        fontFamilyName: settings.fontFamilyName || "smart-icons",
        descent: settings.descent || 64,
        round: settings.round || 10e12,
        normalize: typeof settings.normalize === 'undefined' ? true : !!settings.normalize,
        callback: settings.callback || function () {
        }// the callback function after compile
    };
    var files = glob.sync(options.src, {
        realpath: true,
        matchBase: /.svg/i
    });
    if (!files.length) {
        console.warn('specified empty list of source SVG files.');
        options.callback();
        return;
    }
    if (!options.dest) {
        console.warn('no output path');
        options.callback();
        return;
    }
    restoreOutputDir(options.dest);

    options = _.extend(options, {
        files: files,
        glyphs: []
    });
    options.glyphs = options.files.map(function (file) {
        return path.basename(file).replace(path.extname(file), '');
    });
    // Check or generate codepoints
    var currentCodepoint = options.startCodepoint;

    if (!options.codepoints) options.codepoints = {};

    options.glyphs.forEach(function (name) {
        if (!options.codepoints[name]) {
            options.codepoints[name] = getNextCodepoint();
        }
    });
    engine(options, function (result) {
        if (result === false) {
            // Font was not created, exit
            options.callback();
            return;
        }
        if (result) {
            options = _.extend(options, result);
        }
        generateStylesheet();
    });
    /**
     * Create output directory
     * @param {String} dir
     */
    function restoreOutputDir(dir) {
        mkdirp.sync(dir);
    }

    /**
     * Generate stylesheet
     */
    function generateStylesheet() {
        // Relative fonts path
        var relativeFontPath = path.relative(path.dirname(options.destStyleFile), options.dest);

        options.relativeFontPath = normalizePath(relativeFontPath);

        // Generate font URLs to use in @font-face
        var fontSrcs = {};
        options.order.forEach(function (type) {
            if (!has(options.types, type)) return;
            wf.fontsSrcsMap[type].forEach(function (font, index) {
                if (font) {
                    var ext = font.ext.replace('{fontName}', options.fontName);
                    var uri = options.relativeFontPath + options.fontName + ext;
                    if (options.embed) {
                        uri = embedFont(wf.getFontPath(options, type));
                    }
                    fontSrcs[ext] = {
                        src: font.src.replace('{uri}', uri),
                        ext: ext
                    };
                }
            });
        });
        // create style file
        createStyleFile(fontSrcs);
        // if base64 needed, delete all the font files
        if (options.embed) {
            del(options.dest);
        }
    }

    /**
     * create style file(less,css,sass)
     *
     * @param {Object} json data of font src
     * @return {String}
     */
    function createStyleFile(fontSrcs) {
        var content = generateFontFaceText(fontSrcs) + generateIconStyleText();
        mkdirp(path.dirname(options.destStyleFile));
        fs.writeFileSync(options.destStyleFile, content);
        return content;
    }

    /**
     * Convert a string of comma seperated words into an array
     *
     * @param {String} val Input string
     * @return {Array}
     */
    function optionToArray(option) {
        return !option ? null : typeof option === 'string' ? option.split(',') : option;
    }

    /**
     * Check if a value exists in an array
     *
     * @param {Array} haystack Array to find the needle in
     * @param {Mixed} needle Value to find
     * @return {Boolean} Needle was found
     */
    function has(haystack, needle) {
        return haystack.indexOf(needle) !== -1;
    }

    /**
     * Find next unused codepoint.
     *
     * @return {Integer}
     */
    function getNextCodepoint() {
        while (_.contains(options.codepoints, currentCodepoint)) {
            currentCodepoint++;
        }
        return currentCodepoint;
    }

    /**
     * Convert font file to data:uri and remove source file
     *
     * @param {String} fontFile Font file path
     * @return {String} Base64 encoded string
     */
    function embedFont(fontFile) {
        // Convert to data:uri
        var dataUri = fs.readFileSync(fontFile, 'base64');
        var type = path.extname(fontFile).substring(1);
        var fontUrl = 'data:application/x-font-' + type + ';charset=utf-8;base64,' + dataUri;

        return fontUrl;
    }

    /**
     * Append a slash to end of a filepath if it not exists and make all slashes forward
     *
     * @param {String} filepath File path
     * @return {String}
     */
    function normalizePath(filepath) {
        if (!filepath.length) return filepath;

        // Make all slashes forward
        filepath = filepath.replace(/\\/g, '/');

        // Make sure path ends with a slash
        if (!_s.endsWith(filepath, '/')) {
            filepath += '/';
        }

        return filepath;
    }

    /**
     * Generate content for @font-face
     *
     * @param {Object} json data of font
     * @return {String}
     */
    function generateFontFaceText(fontSrcs) {
        var text = "@font-face {\n\
            font-family: " + options.fontFamilyName + ";\n";
        var allsSrc = [];

        for (var i in fontSrcs) {
            var font = fontSrcs[i];
            if (font.ext === '.eot') {
                text += 'src: ' + font.src + ';\n';
            } else {
                allsSrc.push(font.src);
            }
        }
        if (allsSrc.length) {
            text += 'src: ' + allsSrc.join(',') + ';\n';
        }
        text += "font-style: normal;\n\
                 font-weight: normal;\n\
        }\n";
        return text;
    }

    /**
     * Generate content for icon class style
     *
     * * @return {String}q
     */
    function generateIconStyleText() {
        var text = "[class^='" + options.classPrefix + "']:before, [class*='" + options.classPrefix + "']:before {\n\
        display: inline-block;\n\
        width:10px;\n\
        height:10px;\n\
        font-family: '" + options.fontFamilyName + "' !important;\n\
        -webkit-font-smoothing:antialiased;\n\
        }\n";

        for (var i in options.codepoints) {
            var codepoint = options.codepoints[i];
            text += "." + options.classPrefix + i + ":before {content: '\\" + codepoint.toString(16) + "';}\n";
        }
        return text;
    }

};