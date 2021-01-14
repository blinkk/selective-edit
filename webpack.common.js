const path = require('path');

const entry = {
  example: './src/example.ts',
};

module.exports = {
  entry: entry,
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, './dist/src/'),
    filename: '[name].min.js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
