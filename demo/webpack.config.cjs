const path = require("path");
const webpack = require("webpack");

module.exports = {
  context: path.resolve(__dirname),
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "./"),
    filename: "./bundle.js",
  },
  module: {
    rules: [
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.js$/, use: "babel-loader", exclude: /node_modules/ },
    ],
  },
  resolve: {
    extensions: [".js", ".json"],
  },
  plugins: [new webpack.NoEmitOnErrorsPlugin()],
  devServer: {
    host: "127.0.0.1",
    port: 8093,
    historyApiFallback: false,
    hot: true,
    static: path.join(__dirname),
  },
};
