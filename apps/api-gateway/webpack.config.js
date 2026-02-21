const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // A MÁGICA ESTÁ AQUI:
        // Isso diz ao Webpack: "Ignore o node_modules, EXCETO os pacotes que começam com @aura/"
        // Assim, ele vai empacotar todo o seu TypeScript das libs no main.js final.
        allowlist: [/^@aura\//],
      }),
    ],
  };
};