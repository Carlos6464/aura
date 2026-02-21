const path = require('path')

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    alias: {
      '@aura/domain': path.resolve(__dirname, '../../libs/domain/src/index.ts'),
      '@aura/application': path.resolve(__dirname, '../../libs/application/src/index.ts'),
    },
  },
})