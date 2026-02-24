import { describe, it, expect, beforeAll } from 'vitest'
import { JwtTokenService } from './jwt-token-service'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

describe('JwtTokenService', () => {
  let sut: JwtTokenService
  const secret = 'test-secret-key-123'

  beforeAll(() => {
    // Usando os valores padrão do seu construtor
    sut = new JwtTokenService(secret)
  })

  it('deve gerar um access token JWT válido', () => {
    const payload = { sub: 'user-123', role: 'ADMIN' }
    const token = sut.generateAccessToken(payload)

    // Decodifica e verifica se o JWT gerado tem os dados corretos
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload
    
    expect(decoded.sub).toBe('user-123')
    expect(decoded.role).toBe('ADMIN')
    expect(decoded.exp).toBeDefined()
  })

  it('deve gerar um refresh token opaco e aleatório de 64 bytes (128 caracteres hex)', () => {
    const refreshToken = sut.generateRefreshToken()

    expect(typeof refreshToken).toBe('string')
    expect(refreshToken).toHaveLength(128) // 64 bytes viram 128 chars no formato hexadecimal
  })

  it('deve gerar um hash SHA-256 consistente para o token', () => {
    const rawToken = 'meu-token-secreto'
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    const hash = sut.hashToken(rawToken)

    expect(hash).toBe(expectedHash)
  })

  it('deve calcular corretamente a data de expiração do refresh token', () => {
    const now = Date.now()
    const expiresAt = sut.getRefreshTokenExpiresAt()

    // 7 dias em milissegundos = 7 * 24 * 60 * 60 * 1000 = 604800000
    const difference = expiresAt.getTime() - now

    // Verifica se a diferença é de aproximadamente 7 dias (damos uma margem de 50ms para a execução do teste)
    expect(difference).toBeGreaterThanOrEqual(604800000 - 50)
    expect(difference).toBeLessThanOrEqual(604800000 + 50)
  })
})