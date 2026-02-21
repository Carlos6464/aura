import { Module } from '@nestjs/common'
import { LoginUseCase, RefreshTokenUseCase } from '@aura/application'
import { AuthController } from './auth.controller'
import { AUTH_TOKENS } from './auth.tokens'
import { InMemoryUserRepository } from './in-memory/in-memory-user.repository'
import { InMemoryRefreshTokenRepository } from './in-memory/in-memory-refresh-token.repository'
import { FakePasswordHasher } from './in-memory/fake-password-hasher'
import { FakeTokenService } from './in-memory/fake-token-service'

// ─────────────────────────────────────────────────────────────────────────────
// Para trocar para banco real:
//   1. Substitua InMemory* por Drizzle*Repository
//   2. Substitua FakePasswordHasher por BcryptPasswordHasher
//   3. Substitua FakeTokenService por JwtTokenService (com secret do .env)
//   Zero mudança no controller ou nos use cases.
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  controllers: [AuthController],
  providers: [
    // ── Implementações (in-memory por enquanto) ──────────────────────────────
    {
      provide: AUTH_TOKENS.USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
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

    // ── Use Cases (injetam as portas pelos tokens) ────────────────────────────
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