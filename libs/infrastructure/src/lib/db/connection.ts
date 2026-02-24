import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as usersSchema from '../schema/users.schema'
import * as refreshTokensSchema from '../schema/refresh-tokens.schema'

const connectionString = process.env.DATABASE_URL || 'postgresql://aura_user:aura_password@localhost:5433/aura_db'

// Cria a conexão standalone
export const queryClient = postgres(connectionString)

export const db = drizzle(queryClient, { schema: { ...usersSchema, ...refreshTokensSchema } })