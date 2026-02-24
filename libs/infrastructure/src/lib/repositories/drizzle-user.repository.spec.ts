import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db, queryClient } from '../db/connection'
import { users } from '../schema/users.schema'
import { DrizzleUserRepository } from './drizzle-user.repository'
import { User, Plan, UserRole } from '@aura/domain'
import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

describe('DrizzleUserRepository (Integration)', () => {
  let sut: DrizzleUserRepository

  // Mapeamos os e-mails específicos que vamos usar nesse teste
  const testEmails = ['teste@aura.com', 'busca@aura.com', 'update@aura.com']

  beforeAll(() => {
    sut = new DrizzleUserRepository(db as any)
  })

  beforeEach(async () => {
    // APAGA APENAS OS USUÁRIOS DESTE ARQUIVO! 
    // Assim não destruímos o usuário PAI do teste de Refresh Token que roda em paralelo.
    await db.delete(users).where(inArray(users.email, testEmails))
  })

  afterAll(async () => {
    await db.delete(users).where(inArray(users.email, testEmails))
    await queryClient.end() 
  })

  it('deve salvar um usuário no banco de dados', async () => {
    const id = randomUUID()
    const user = User.create({
      id,
      email: 'teste@aura.com',
      passwordHash: 'hash123',
      plan: Plan.FREE(),
      role: UserRole.USER,
      monitoredApps: ['nubank'],
    })

    await sut.save(user)

    const [savedDbUser] = await db.select().from(users).where(eq(users.id, id))
    
    expect(savedDbUser).toBeDefined()
    expect(savedDbUser.email).toBe('teste@aura.com')
    expect(savedDbUser.planId).toBe('FREE')
  })

  it('deve buscar um usuário existente pelo email', async () => {
    const id = randomUUID()
    const user = User.create({
      id,
      email: 'busca@aura.com',
      passwordHash: 'hash456',
      plan: Plan.PREMIUM(),
      role: UserRole.ADMIN,
    })
    await sut.save(user)

    const foundUser = await sut.findByEmail('busca@aura.com')

    expect(foundUser).not.toBeNull()
    expect(foundUser?.id).toBe(id)
    expect(foundUser?.email.value).toBe('busca@aura.com')
    expect(foundUser?.role).toBe(UserRole.ADMIN)
    expect(foundUser?.plan.id).toBe('PREMIUM')
  })

  it('deve retornar null se o email não existir', async () => {
    const result = await sut.findByEmail('fantasma@aura.com')
    expect(result).toBeNull()
  })

  it('deve atualizar um usuário existente (upsert)', async () => {
    const id = randomUUID()
    const user = User.create({
      id,
      email: 'update@aura.com',
      passwordHash: 'hash',
      plan: Plan.FREE(),
      role: UserRole.USER,
    })
    await sut.save(user)

    const updatedUser = User.create({
      id: user.id,
      email: 'update@aura.com',
      passwordHash: 'novo-hash-alterado',
      plan: Plan.PREMIUM(),
      role: UserRole.USER,
    })

    await sut.save(updatedUser)

    const foundUser = await sut.findById(id)
    expect(foundUser?.plan.id).toBe('PREMIUM')
    expect(foundUser?.passwordHash).toBe('novo-hash-alterado')
  })
})