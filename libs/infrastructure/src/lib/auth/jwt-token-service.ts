import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { ITokenService } from '@aura/application'

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly accessTokenTtlSeconds: number = 60 * 15,          // 15 min
    private readonly refreshTokenTtlSeconds: number = 60 * 60 * 24 * 7 // 7 dias
  ) {}

  generateAccessToken(payload: { sub: string; role: string }): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.accessTokenTtlSeconds,
      algorithm: 'HS256',
    })
  }

  // Gera token opaco aleatório (não JWT) — mais seguro para refresh
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  // SHA-256 do token puro — só o hash vai pro banco
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.refreshTokenTtlSeconds * 1000)
  }
}