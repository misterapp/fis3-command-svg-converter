"use strict";

var path = require('path');
var fs = require('fs');
var exists = fs.existsSync;
var webfont = require("./lib/webfont");


exports.name = 'svg converter';
exports.usage = '[options]';
exports.desc = 'fis3 svg converter,support svg,eot,ttf,woff,woff2';

exports.options = {
    '-s, --src <src>': 'set svg icon dir',
    '-d, --dest <dest>': 'set font dir',
    '-f, --destStyleFile <destStyleFile>': 'set style file path'
};

exports.run = function (argv, cli, env) {

    var root = env.configBase || process.cwd();

    var filepath = env.configPath || path.resolve(root, 'fis-conf.js');

    if (argv.h || argv.help) {
        return cli.help(exports.name, exports.options);
    }

    if (exists(filepath)) {
        require(filepath);
    }
    var settings = fis.config.get("svg-converter") || {};

    settings.src = argv.src || argv.s || settings.src;
    settings.dest = argv.dest || argv.d || settings.dest;
    settings.destStyleFile = argv.destStyleFile || argv.f || settings.destStyleFile;

    webfont.generateFonts(settings);

};