// NestJS não consegue resolver interfaces TypeScript em runtime.
// Esses tokens são a "chave" que o módulo usa para mapear
// interface → implementação concreta via @Inject()

export const AUTH_TOKENS = {
  USER_REPOSITORY:          'IUserRepository',
  REFRESH_TOKEN_REPOSITORY: 'IRefreshTokenRepository',
  PASSWORD_HASHER:          'IPasswordHasher',
  TOKEN_SERVICE:            'ITokenService',
} as const