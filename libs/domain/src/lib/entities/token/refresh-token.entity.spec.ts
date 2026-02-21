import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RefreshToken } from './refresh-token.entity'

describe('RefreshToken Entity', () => {
  // Mock do tempo para evitar flutuações em testes baseados em datas
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const futureDate = new Date(new Date().getTime() + 1000 * 60 * 60) // +1 hora
  const pastDate = new Date(new Date().getTime() - 1000 * 60 * 60)   // -1 hora

  it('deve criar um RefreshToken válido', () => {
    const token = RefreshToken.create({
      id: 'token-1',
      userId: 'user-1',
      tokenHash: 'hashed-value',
      expiresAt: futureDate
    })

    expect(token.id).toBe('token-1')
    expect(token.isValid()).toBe(true)
    expect(token.isRevoked()).toBe(false)
  })

  it('deve lançar erro ao criar um token com data de expiração no passado', () => {
    expect(() => {
      RefreshToken.create({
        id: 'token-1',
        userId: 'user-1',
        tokenHash: 'hashed-value',
        expiresAt: pastDate
      })
    }).toThrow('Data de expiração deve ser futura')
  })

  it('deve invalidar o token quando for revogado', () => {
    const token = RefreshToken.create({
      id: 'token-1',
      userId: 'user-1',
      tokenHash: 'hashed-value',
      expiresAt: futureDate
    })

    token.revoke()

    expect(token.isRevoked()).toBe(true)
    expect(token.isValid()).toBe(false)
    expect(token.revokedAt).toBeInstanceOf(Date)
  })

  it('deve lançar erro ao tentar revogar um token que já foi revogado', () => {
    const token = RefreshToken.create({
      id: 'token-1',
      userId: 'user-1',
      tokenHash: 'hashed-value',
      expiresAt: futureDate
    })

    token.revoke()

    expect(() => token.revoke()).toThrow(/já foi revogado/)
  })

  it('deve identificar quando um token está expirado', () => {
    const token = RefreshToken.create({
      id: 'token-1',
      userId: 'user-1',
      tokenHash: 'hashed-value',
      expiresAt: futureDate
    })

    // Avança o tempo no relógio do sistema para depois da expiração
    vi.advanceTimersByTime(1000 * 60 * 61) // 61 minutos

    expect(token.isExpired()).toBe(true)
    expect(token.isValid()).toBe(false)
  })
})