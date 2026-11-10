const path = require('path')

// baseUrl: '/nyx',

module.exports = {
    // Permet de servir la meme construction sous un sous-chemin (/nyxv3/) sans toucher au code :
    // la valeur par defaut reste la racine.
    publicPath: process.env.VUE_APP_PUBLIC_PATH || '/',
    lintOnSave: false,
    productionSourceMap: false,
    transpileDependencies: [],
    chainWebpack: config => {
        config.plugins.delete('eslint');
    },
    configureWebpack: {
        resolve: {
            // The FontAwesome 6 icon packages declare `"exports": { ".": { "import": "./index.mjs" } }`
            // plus `"./*": "./*.js"`. A wildcard import (`pkg/${file}.js`) makes webpack enumerate the
            // package through that map and fail on the `.` entry ("no valid target file was found"),
            // and it also forbids the `.js` extension. Pointing an alias at the folder bypasses the
            // map entirely: the requests become ordinary file paths, which is what a per-icon chunk
            // needs.
            alias: {
                '@fa-solid': path.resolve(__dirname, 'node_modules/@fortawesome/free-solid-svg-icons'),
                '@fa-regular': path.resolve(__dirname, 'node_modules/@fortawesome/free-regular-svg-icons'),
                '@fa-brands': path.resolve(__dirname, 'node_modules/@fortawesome/free-brands-svg-icons'),
            },
        },
    },
};