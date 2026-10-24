// baseUrl: '/nyx',

module.exports = {
    lintOnSave: false,
    productionSourceMap: false,
    transpileDependencies: [],
    chainWebpack: config => {
        config.plugins.delete('eslint');
    }
};