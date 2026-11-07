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
    }
};