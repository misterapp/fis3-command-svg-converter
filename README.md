
## fis3-command-svg-converter

- 基于[grunt-webfont](https://github.com/sapegin/grunt-webfont)的fis3命令行插件

- 支持将svg icons 转化成svg,oet,ttf,woff,woff2，输出相应的样式文件

- 支持将字体文件转发成data uri，替换样式文件中的url


## 开始使用

### 安装插件

执行 `npm install -g fis3-command-svg-converter` 全局安装

### 配置

在fis-conf.js里面添加配置：


```javascript

fis.config.set("svg-converter",{
    src : './static/fonts/icons/**.svg',// svg icon文件，遵循node glob(必选)
    dest : './static/fonts',  //产出字体目录(必选)
    destStyleFile: './static/css/font.less',// 产出的样式文件路径（支持less,css,sass文件）(必选)
    classPrefix: 'icon-',// 字体图标的class前缀
    fontName: "icons",//字体文件的文件名
    types: ['eot','woff2','woff','ttf','svg'],// 字体文件的输出类型
    order: ['eot','woff2','woff','ttf','svg'],// 样式文件中font face src的顺序
    embed: false,// 是否需要将文件base64
    fontHeight: 512,
    startCodepoint: 0xF101,
    fontFamilyName: "smart-icons",
    descent: 64,
    round: 10e12,
    normalize: true
});

```

### 执行编译

执行 `fis3 svg-converter -d ./test/dest -s ./test/src/**.svg -f ./test/css/font.less`






