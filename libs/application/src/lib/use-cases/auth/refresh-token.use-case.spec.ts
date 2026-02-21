// libs/application/src/lib/use-cases/auth/refresh-token.use-case.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefreshTokenUseCase } from './refresh-token.use-case'
import { IUserRepository, IRefreshTokenRepository, ITokenService } from '../../ports/auth.ports'
import { User, Plan, UserRole, RefreshToken } from '@aura/domain'

function makeUserRepo(user: User | null = null): IUserRepository {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn().mockResolvedValue(user),
    save: vi.fn(),
  }
}

function makeTokenRepo(token: RefreshToken | null = null): IRefreshTokenRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByHash: vi.fn().mockResolvedValue(token),
    revokeAllFromUser: vi.fn(),
  }
}

function makeTokenService(): ITokenService {
  return {
    generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('new-raw-refresh-token'),
    hashToken: vi.fn().mockReturnValue('hashed-token'),
    getRefreshTokenExpiresAt: vi.fn().mockReturnValue(new Date(Date.now() + 100000)),
  }
}

describe('RefreshTokenUseCase', () => {
  let userRepo: IUserRepository
  let tokenRepo: IRefreshTokenRepository
  let tokenService: ITokenService
  let sut: RefreshTokenUseCase
  let validToken: RefreshToken // Definido aqui para escopo

  beforeEach(() => {
    // SEMPRE criar instâncias novas aqui dentro
    validToken = RefreshToken.create({
      id: 't1',
      userId: 'u1',
      tokenHash: 'hashed-old',
      expiresAt: new Date(Date.now() + 10000)
    })

    const user = User.create({
      id: 'u1',
      email: 'adriano@email.com',
      plan: Plan.FREE(),
      role: UserRole.USER
    })

    userRepo = makeUserRepo(user)
    tokenRepo = makeTokenRepo(validToken)
    tokenService = makeTokenService()
    sut = new RefreshTokenUseCase(userRepo, tokenRepo, tokenService)
  })

  it('deve gerar um novo par de tokens se o refresh token for válido', async () => {
    const result = await sut.execute('old-raw-token')
    expect(result.accessToken).toBe('new-access-token')
    expect(result.refreshToken).toBe('new-raw-refresh-token')
  })

  it('deve revogar o token antigo (rotação de tokens) ao gerar um novo', async () => {
    await sut.execute('old-raw-token')
    expect(validToken.isRevoked()).toBe(true)
    expect(tokenRepo.save).toHaveBeenCalledWith(validToken)
  })

  it('deve lançar erro se o token não for encontrado ou estiver inválido', async () => {
    // Sobrescreve o mock apenas para este teste
    vi.spyOn(tokenRepo, 'findByHash').mockResolvedValue(null)
    await expect(sut.execute('invalid-token'))
      .rejects.toThrow('Token de atualização inválido ou expirado')
  })

  it('deve salvar o novo refresh token hasheado no banco', async () => {
    await sut.execute('old-raw-token')
    expect(tokenService.hashToken).toHaveBeenCalledWith('new-raw-refresh-token')
    // Chamado 2 vezes: 1 para revogar o antigo, 1 para salvar o novo
    expect(tokenRepo.save).toHaveBeenCalledTimes(2)
  })

  it('deve lançar erro se o usuário dono do token não existir mais', async () => {
    vi.spyOn(userRepo, 'findById').mockResolvedValue(null)
    await expect(sut.execute('old-raw-token'))
      .rejects.toThrow('Usuário não encontrado')
  })
})