import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@aura/domain': resolve('../../libs/domain/src/index.ts'),
      '@aura/application': resolve('../../libs/application/src/index.ts'),
    },
  },
})