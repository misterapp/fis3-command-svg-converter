/**
 * refer to grunt-webfont: Node.js engine
 *
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function (o, allDone) {
    'use strict';
    var fs = require('fs');
    var path = require('path');
    var async = require('async');
    var StringDecoder = require('string_decoder').StringDecoder;
    var svgicons2svgfont = require('svgicons2svgfont');
    var svg2ttf = require('svg2ttf');
    var ttf2woff = require('ttf2woff');
    var ttf2eot = require('ttf2eot');
    var ttf2woff2 = require('ttf2woff2');
    var SVGO = require('svgo');
    var MemoryStream = require('memorystream');
    var logger = require('winston');
    var wf = require('../util/util');

    var fonts = {};

    var generators = {
        svg: function (done) {
            var font = '';
            var decoder = new StringDecoder('utf8');
            console.log({
                fontName: o.fontName,
                fontHeight: o.fontHeight,
                descent: o.descent,
                normalize: o.normalize,
                round: o.round,
                log: logger.verbose.bind(logger),
                error: logger.error.bind(logger)
            });
            svgFilesToStreams(o.files, function (streams) {
                var stream = svgicons2svgfont(streams, {
                    fontName: o.fontName,
                    fontHeight: o.fontHeight,
                    descent: o.descent,
                    normalize: o.normalize,
                    round: o.round,
                    log: logger.verbose.bind(logger),
                    error: logger.error.bind(logger)
                });
                stream.on('data', function (chunk) {
                    font += decoder.write(chunk);
                });
                stream.on('end', function () {
                    fonts.svg = font;
                    done(font);
                });
            });
        },

        ttf: function (done) {
            getFont('svg', function (svgFont) {
                var font = svg2ttf(svgFont, {});
                font = new Buffer(font.buffer);
                fonts.ttf = font;
                done(font);
            });
        },

        woff: function (done) {
            getFont('ttf', function (ttfFont) {
                var font = ttf2woff(new Uint8Array(ttfFont), {});
                font = new Buffer(font.buffer);
                fonts.woff = font;
                done(font);
            });
        },
        woff2: function(done) {
            getFont('ttf', function (ttfFont) {
                var font = ttf2woff2(ttfFont);
                fonts.woff2 = font;
                done(font);
            });
        },
        eot: function (done) {
            getFont('ttf', function (ttfFont) {
                var font = ttf2eot(new Uint8Array(ttfFont));
                font = new Buffer(font.buffer);
                fonts.eot = font;
                done(font);
            });
        }
    };

    var steps = [];

    // Font types
    var typesToGenerate = o.types.slice();

    if (o.types.indexOf('woff2') !== -1 && o.types.indexOf('ttf'  === -1)) typesToGenerate.push('ttf');

    typesToGenerate.forEach(function (type) {
        steps.push(createFontWriter(type));
    });
    // Run!
    async.waterfall(steps, allDone);

    function getFont(type, done) {
        if (fonts[type]) {
            done(fonts[type]);
        }
        else {
            generators[type](done);
        }
    }

    function createFontWriter(type) {
        return function (done) {
            getFont(type, function (font) {
                fs.writeFile(wf.getFontPath(o, type), font, function () {
                    done();
                });
            });
        };
    }

    function svgFilesToStreams(files, done) {
        async.map(files, function (file, fileDone) {
            var svg = fs.readFileSync(file, 'utf8');
            var svgo = new SVGO();
            try {
                svgo.optimize(svg, function (res) {
                    var idx = files.indexOf(file);
                    var name = o.glyphs[idx];
                    var stream = new MemoryStream(res.data, {
                        writable: false
                    });
                    fileDone(null, {
                        codepoint: o.codepoints[name],
                        name: name,
                        stream: stream
                    });
                });
            }
            catch (err) {
                return fileDone(err);
            }
        }, function (err, streams) {
            if (err) {
                logger.error('Can’t simplify SVG file with SVGO.\n\n' + err);
                allDone(false);
            }
            else {
                done(streams);
            }
        });
    }
};
