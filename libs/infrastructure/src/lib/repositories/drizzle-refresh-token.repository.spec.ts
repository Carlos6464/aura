import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db, queryClient } from '../db/connection'
import { users } from '../schema/users.schema'
import { refreshTokens } from '../schema/refresh-tokens.schema'
import { DrizzleRefreshTokenRepository } from './drizzle-refresh-token.repository'
import { RefreshToken } from '@aura/domain'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

describe('DrizzleRefreshTokenRepository (Integration)', () => {
  let sut: DrizzleRefreshTokenRepository
  let testUserId: string

  beforeAll(async () => {
    sut = new DrizzleRefreshTokenRepository(db as any)
    testUserId = randomUUID()
    
    await db.insert(users).values({
      id: testUserId,
      email: 'user-token@aura.com',
      passwordHash: 'hash',
      planId: 'FREE',
      role: 'USER',
    })
  })

  beforeEach(async () => {
    // Isolamos a exclusão apenas para este usuário para evitar o "Cascade Delete" dos testes rodando em paralelo!
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, testUserId))
  })

  afterAll(async () => {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, testUserId))
    await db.delete(users).where(eq(users.id, testUserId))
    await queryClient.end() 
  })

  it('deve salvar um refresh token no banco de dados', async () => {
    const id = randomUUID()
    const token = RefreshToken.create({
      id,
      tokenHash: 'hash-valido-123',
      userId: testUserId,
      expiresAt: new Date(Date.now() + 100000), // Data no futuro
    })

    await sut.save(token)

    const [savedDbToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.id, id))
    
    expect(savedDbToken).toBeDefined()
    expect(savedDbToken.tokenHash).toBe('hash-valido-123')
    expect(savedDbToken.userId).toBe(testUserId)
    expect(savedDbToken.revokedAt).toBeNull()
  })

  it('deve buscar um token existente pelo hash', async () => {
    const id = randomUUID()
    const token = RefreshToken.create({
      id,
      tokenHash: 'hash-de-busca',
      userId: testUserId,
      expiresAt: new Date(Date.now() + 100000), // Data no futuro
    })
    await sut.save(token)

    const foundToken = await sut.findByHash('hash-de-busca')

    expect(foundToken).not.toBeNull()
    expect(foundToken?.id).toBe(id)
    expect(foundToken?.userId).toBe(testUserId)
    expect(foundToken?.tokenHash).toBe('hash-de-busca')
  })

  it('deve retornar null ao buscar um hash inexistente', async () => {
    const result = await sut.findByHash('hash-fantasma')
    expect(result).toBeNull()
  })

  it('deve revogar todos os tokens de um usuário', async () => {
    // Datas no futuro
    const token1 = RefreshToken.create({ id: randomUUID(), tokenHash: 't1', userId: testUserId, expiresAt: new Date(Date.now() + 100000) })
    const token2 = RefreshToken.create({ id: randomUUID(), tokenHash: 't2', userId: testUserId, expiresAt: new Date(Date.now() + 100000) })
    
    await sut.save(token1)
    await sut.save(token2)

    await sut.revokeAllFromUser(testUserId)

    const allTokens = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, testUserId))
    
    expect(allTokens).toHaveLength(2)
    expect(allTokens[0].revokedAt).not.toBeNull()
    expect(allTokens[1].revokedAt).not.toBeNull()
  })
})