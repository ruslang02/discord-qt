const path = require("path");
const childProcess = require('child_process');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { IgnorePlugin, DefinePlugin, ProvidePlugin } = require("webpack");
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
let __BUILDNUM__;
try {
  __BUILDNUM__ = childProcess.execSync('git rev-list HEAD --count').toString()
} catch(e) {
  __BUILDNUM__ = 0;
}
console.log(__dirname, process.cwd());
module.exports = {
  mode: process.NODE_ENV || "development",
  entry: {
    index: "./src",
    worker: "./worker"
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        keep_classnames: true
      }
    })],
  },
  target: "node",
  node: {
    __dirname: false,
    __filename: false,
    fs: "empty",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /discord-qt\/node_modules/g,
        use: [
          {
            loader: 'ts-loader',
            options: {
              // transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: "file-loader",
            options: { publicPath: "dist" },
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.node$/,
        use: [
          {
            loader: "native-addon-loader",
            options: { name: "[name]-[hash].[ext]" },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx", ".json"],
    mainFields: ["main"],
    alias: {
        'fetch': path.join(__dirname, '../node_modules', 'whatwg-fetch', 'fetch.js'),
    }
  },
  plugins: [
    new IgnorePlugin({ resourceRegExp: /(node-opus)|(@discordjs\/opus)|(opusscript|ffmpeg-static)/g }),
    new DefinePlugin({ __BUILDNUM__ }),
    new ProvidePlugin({
        'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'assets', to: 'assets' }
      ]
    })
  ],
  stats: {
    warnings: false
  },
};
