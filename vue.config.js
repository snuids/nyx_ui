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

        // `console.log` is removed from the production bundle, not merely silenced at runtime: the
        // console had 294 of them, they shipped in every chunk, and they carried the names of the
        // screens and the payloads being handled into the browser console. `console.warn` and
        // `console.error` stay — a real failure should still say so.
        //
        // The calls stay in the sources: they are what makes a local debugging session readable, and
        // `no-console` in `.eslintrc.js` already flags new ones when linting with NODE_ENV=production.
        config.optimization.minimizer('terser').tap(args => {
            const options = args[0] || {};
            options.terserOptions = options.terserOptions || {};
            options.terserOptions.compress = options.terserOptions.compress || {};
            options.terserOptions.compress.pure_funcs = ['console.log', 'console.debug'];
            return args;
        });
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