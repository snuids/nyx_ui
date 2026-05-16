// baseUrl: '/nyx',

module.exports = {
    lintOnSave: false,
    transpileDependencies: [],
    chainWebpack: config => {
        config.plugins.delete('eslint');
    }
};