import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AUTH_TOKENS } from './auth.tokens'
import { InMemoryUserRepository } from './in-memory/in-memory-user.repository'
import { InMemoryRefreshTokenRepository } from './in-memory/in-memory-refresh-token.repository'
import { FakePasswordHasher } from './in-memory/fake-password-hasher'
import { FakeTokenService } from './in-memory/fake-token-service'
import { LoginUseCase, RefreshTokenUseCase } from '@aura/application'

@Module({
  controllers: [AuthController],
  providers: [
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
