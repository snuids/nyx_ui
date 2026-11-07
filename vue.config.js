// baseUrl: '/nyx',

module.exports = {
    // Lets the same build be served under a sub-path (/nyxv2/) without touching the code: the
    // asset URLs are written into index.html at build time, so the prefix has to be known then.
    // The default stays the root, which is what the release image gets.
    publicPath: process.env.VUE_APP_PUBLIC_PATH || '/',
    lintOnSave: false,
    productionSourceMap: false,
    transpileDependencies: [],
    chainWebpack: config => {
        config.plugins.delete('eslint');
    }
};