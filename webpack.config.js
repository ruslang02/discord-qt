const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const globImporter = require('node-sass-glob-importer');
const { platform, arch } = require('os');

const { readdirSync } = fs;

let __BUILDNUM__;

try {
  __BUILDNUM__ = childProcess.execSync('git rev-list HEAD --count').toString();
} catch (e) {
  __BUILDNUM__ = 0;
}

module.exports = (_env, argv) => {
  const isDev = argv.mode !== 'production';
  let themes = {};

  readdirSync('./src/themes').forEach((value) => {
    themes = {
      ...themes,
      [value.replace('.scss', '')]: `./src/themes/${value}`,
    };
  });

  return {
    devtool: 'eval-cheap-module-source-map',
    mode: isDev ? 'development' : 'production',
    entry: {
      'index.js': './src',
      'worker.js': './worker',
      ...themes,
    },
    optimization: {
      minimize: !isDev,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
          },
        }),
      ],
    },
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
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
              },
            },
          ],
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
            'css-loader?url=false',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  importer: globImporter(),
                },
              },
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
      exportsFields: [],
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.wasm'],
      mainFields: ['main'],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new DefinePlugin({ __BUILDNUM__ }),
      new MiniCssExtractPlugin({
        filename: 'themes/[name].css',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'assets', to: 'assets' },
          { from: 'src/locales', to: 'locales' },
          { from: 'node_modules/opusscript/build/opusscript_native_wasm.wasm' },
          { from: 'node_modules/source-sans-pro/TTF/*', to: 'assets/fonts/[name].[ext]' },
          { from: 'node_modules/ffmpeg-static/ffmpeg', noErrorOnMissing: true },
          { from: 'node_modules/ffmpeg-static/ffmpeg.exe', noErrorOnMissing: true },
          {
            from: `node_modules/ffplay-static/bin/${platform()}/${arch()}/ffplay`,
            noErrorOnMissing: true,
          },
          {
            from: `node_modules/ffplay-static/bin/${platform()}/${arch()}/ffplay.exe`,
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
  };
};
