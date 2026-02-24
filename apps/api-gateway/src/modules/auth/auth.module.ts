import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AUTH_TOKENS } from './auth.tokens';

// Imports da Infraestrutura Real
import { DrizzleUserRepository } from '@aura/infrastructure';
import { DRIZZLE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Imports dos Fakes (serão substituídos aos poucos)
import { InMemoryRefreshTokenRepository } from './in-memory/in-memory-refresh-token.repository';
import { FakePasswordHasher } from './in-memory/fake-password-hasher';
import { FakeTokenService } from './in-memory/fake-token-service';

// Use Cases
import { LoginUseCase, RefreshTokenUseCase } from '@aura/application';

@Module({
  controllers: [AuthController],
  providers: [
    // 1. Repositório Real injetando a conexão do banco de dados
    {
      provide: AUTH_TOKENS.USER_REPOSITORY,
      useFactory: (db: PostgresJsDatabase) => {
        return new DrizzleUserRepository(db);
      },
      inject: [DRIZZLE_CONNECTION],
    },
    // 2. Os Fakes continuam normais até a hora de substituí-los
    {
      provide: AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY,
      useClass: InMemoryRefreshTokenRepository,
    },
    {
      provide: AUTH_TOKENS.PASSWORD_HASHER,
      useClass: FakePasswordHasher,
    },
    {
      provide: AUTH_TOKENS.TOKEN_SERVICE,
      useClass: FakeTokenService,
    },
    // 3. Os Use Cases não mudam absolutamente nada
    {
      provide: LoginUseCase,
      useFactory: (userRepo, tokenRepo, hasher, tokenService) =>
        new LoginUseCase(userRepo, tokenRepo, hasher, tokenService),
      inject: [
        AUTH_TOKENS.USER_REPOSITORY,
        AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY,
        AUTH_TOKENS.PASSWORD_HASHER,
        AUTH_TOKENS.TOKEN_SERVICE,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (userRepo, tokenRepo, tokenService) =>
        new RefreshTokenUseCase(userRepo, tokenRepo, tokenService),
      inject: [
        AUTH_TOKENS.USER_REPOSITORY,
        AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY,
        AUTH_TOKENS.TOKEN_SERVICE,
      ],
    },
  ],
})
export class AuthModule {}