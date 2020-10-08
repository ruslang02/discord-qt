const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { IgnorePlugin, DefinePlugin, ProvidePlugin, NormalModuleReplacementPlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const globImporter = require('node-sass-glob-importer');
const { readdirSync } = fs;

let __BUILDNUM__;
try {
  __BUILDNUM__ = childProcess.execSync('git rev-list HEAD --count').toString()
} catch (e) {
  __BUILDNUM__ = 0;
}
module.exports = (_env, argv) => {
  const isDev = argv.mode !== 'production';
  const themes = Object.fromEntries(readdirSync('./src/themes').map(value => [
    value.replace('.scss', ''),
    './src/themes/' + value
  ]));
  console.log(themes);
  return {
    mode: isDev ? 'development' : 'production',
    entry: {
      'index.js': './src',
      'worker.js': './worker',
      ...themes
    },
    optimization: {
      minimize: !isDev,
      minimizer: [new TerserPlugin({
        terserOptions: {
          keep_classnames: true
        }
      })],
    },
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
      fs: 'empty',
    },
    output: {
      filename: '[name]',
      path: path.resolve(__dirname, 'dist'),
      pathinfo: false,
    },
    module: {
      exprContextCritical: false,
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /discord-qt\/node_modules/g,
          use: [
            'thread-loader',
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                happyPackMode: true,
                experimentalWatchApi: true,
              }
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: { publicPath: 'dist' },
            },
          ],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  importer: globImporter(),
                }
              }
            },
          ],
        },
        {
          test: /\.node$/,
          use: [
            {
              loader: 'native-addon-loader',
              options: { name: '[name].[ext]' },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.wasm'],
      mainFields: ['main'],
      alias: {
        'fetch': path.join(__dirname, '../node_modules', 'whatwg-fetch', 'fetch.js'),
      }
    },
    plugins: [
      new CleanWebpackPlugin(),
      // new IgnorePlugin({ resourceRegExp: /node-opus|opusscript|ffmpeg-static/g }),
      new DefinePlugin({ __BUILDNUM__ }),
      //new ProvidePlugin({
      //  'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
      //}),
      new NormalModuleReplacementPlugin(
        /^bindings$/,
        require.resolve("./bindings")
      ),
      new MiniCssExtractPlugin({
        filename: 'themes/[name].css',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'assets', to: 'assets' },
          { from: 'locales', to: 'locales' },
          { from: 'node_modules/opusscript/build/opusscript_native_wasm.wasm' },
          { from: 'node_modules/ffmpeg-static/ffmpeg' }
        ]
      })
    ],
    stats: {
    },
  }
};
