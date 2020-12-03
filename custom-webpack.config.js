const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const supportedLocales = ['es'];

module.exports = {
  externals: {
    moment: 'moment'
  },
  plugins: [
    new webpack.ContextReplacementPlugin(
      /date\-fns[\/\\]/,
      new RegExp(`[/\\\\\](${supportedLocales.join('|')})[/\\\\\]index\.js$`)
    ),
    new BundleAnalyzerPlugin()
  ]
};
