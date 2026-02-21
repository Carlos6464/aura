import { User, RefreshToken} from '@aura/domain'

// ── Repositórios ──────────────────────────────────────────────────────────────

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  save(user: User): Promise<void>
}

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<void>
  findByHash(tokenHash: string): Promise<RefreshToken | null>
  revokeAllFromUser(userId: string): Promise<void>
}

// ── Serviços ──────────────────────────────────────────────────────────────────

// Infra decide o algoritmo (bcrypt, argon2) — domínio não sabe
export interface IPasswordHasher {
  hash(plain: string): Promise<string>
  compare(plain: string, hash: string): Promise<boolean>
}

// Infra decide o secret e algoritmo JWT — domínio não sabe
export interface ITokenService {
  generateAccessToken(payload: { sub: string; role: string }): string
  generateRefreshToken(): string        // token aleatório puro (não hasheado)
  hashToken(token: string): string      // sha256 — para guardar no banco
  getRefreshTokenExpiresAt(): Date
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  accessToken: string
  refreshToken: string    // token puro — enviado só aqui, nunca mais
  user: {
    id: string
    email: string
    role: string
    plan: string
  }
}