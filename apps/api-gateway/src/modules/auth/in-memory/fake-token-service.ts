import * as jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'node:crypto'
import { ITokenService } from '@aura/application'

const DEV_SECRET = 'aura-dev-secret-nao-use-em-producao'

export class FakeTokenService implements ITokenService {
  generateAccessToken(payload: { sub: string; role: string }): string {
    return jwt.sign(payload, DEV_SECRET, { expiresIn: 900 })
  }

  generateRefreshToken(): string {
    return randomBytes(64).toString('hex')
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  }
}