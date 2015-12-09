module.exports = {
  entry: './src/fxos-fastlist.js',
  output: {
    filename: 'fxos-fastlist.js',
    library: 'FXOSFastlist',
    libraryTarget: 'umd'
  },

  externals: {
    "fxos-component": {
      root: "fxosComponent",
      commonjs: "fxos-component",
      commonjs2: "fxos-component",
      amd: "fxos-component"
    }
  }
}
