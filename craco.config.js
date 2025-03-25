// craco.config.js
module.exports = {
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.(csv|gz)$/,
            type: 'asset/resource',
            generator: {
              filename: 'data/[name][ext]'
            }
          }
        ]
      }
    }
  },
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET"
    }
  }
};