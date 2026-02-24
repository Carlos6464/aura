import { Global, Module } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as usersSchema from '@aura/infrastructure' // Ou o caminho exato para os seus schemas

// Símbolo de injeção
export const DRIZZLE_CONNECTION = 'DRIZZLE_CONNECTION'

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_CONNECTION,
      useFactory: () => {
        // Em produção, isso virá do ConfigService (.env)
        const connectionString = process.env.DATABASE_URL || 'postgresql://aura_user:aura_password@localhost:5433/aura_db'
        
        const queryClient = postgres(connectionString)
        return drizzle(queryClient, { schema: usersSchema })
      },
    },
  ],
  exports: [DRIZZLE_CONNECTION], // Exporta para os outros módulos usarem
})
export class DatabaseModule {}