import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/schema/*.schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Apontando para a porta 5433 que configuramos no docker-compose
    url: process.env.DATABASE_URL || 'postgresql://aura_user:aura_password@localhost:5433/aura_db',
  },
})