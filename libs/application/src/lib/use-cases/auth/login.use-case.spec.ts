import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginUseCase, InvalidCredentialsError } from './login.use-case'
import {
  IUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenService,
} from '../../ports/auth.ports'
import { User, Plan, UserRole, RefreshToken } from '@aura/domain'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides?: Partial<Parameters<typeof User.create>[0]>): User {
  return User.create({
    id: 'user-1',
    email: 'adriano@email.com',
    passwordHash: 'hashed-password',
    plan: Plan.FREE(),
    role: UserRole.USER,
    ...overrides,
  })
}

// ── Mocks das portas (implementações falsas para teste) ───────────────────────

function makeUserRepo(user: User | null = null): IUserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    save: vi.fn().mockResolvedValue(undefined),
  }
}

function makeTokenRepo(): IRefreshTokenRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByHash: vi.fn().mockResolvedValue(null),
    revokeAllFromUser: vi.fn().mockResolvedValue(undefined),
  }
}

function makeHasher(matches: boolean = true): IPasswordHasher {
  return {
    hash: vi.fn().mockResolvedValue('hashed'),
    compare: vi.fn().mockResolvedValue(matches),
  }
}

function makeTokenService(): ITokenService {
  return {
    generateAccessToken: vi.fn().mockReturnValue('access-token-jwt'),
    generateRefreshToken: vi.fn().mockReturnValue('raw-refresh-token'),
    hashToken: vi.fn().mockReturnValue('hashed-refresh-token'),
    getRefreshTokenExpiresAt: vi.fn().mockReturnValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)),
  }
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  let userRepo: IUserRepository
  let tokenRepo: IRefreshTokenRepository
  let hasher: IPasswordHasher
  let tokenService: ITokenService
  let sut: LoginUseCase

  beforeEach(() => {
    const user = makeUser()
    userRepo = makeUserRepo(user)
    tokenRepo = makeTokenRepo()
    hasher = makeHasher(true)
    tokenService = makeTokenService()
    sut = new LoginUseCase(userRepo, tokenRepo, hasher, tokenService)
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('deve retornar accessToken, refreshToken e dados do usuário com credenciais válidas', async () => {
    const result = await sut.execute({
      email: 'adriano@email.com',
      password: 'Senha123',
    })

    expect(result.accessToken).toBe('access-token-jwt')
    expect(result.refreshToken).toBe('raw-refresh-token')
    expect(result.user.email).toBe('adriano@email.com')
    expect(result.user.role).toBe(UserRole.USER)
    expect(result.user.plan).toBe('FREE')
  })

  it('deve salvar o refresh token hasheado no banco — nunca o token puro', async () => {
    await sut.execute({ email: 'adriano@email.com', password: 'Senha123' })

    expect(tokenService.hashToken).toHaveBeenCalledWith('raw-refresh-token')
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: 'hashed-refresh-token',
        userId: 'user-1',
      })
    )
  })

  it('deve gerar o accessToken com sub e role corretos', async () => {
    await sut.execute({ email: 'adriano@email.com', password: 'Senha123' })

    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      role: UserRole.USER,
    })
  })

  // ── Email inválido ─────────────────────────────────────────────────────────

  it('deve lançar InvalidCredentialsError para email com formato inválido', async () => {
    await expect(
      sut.execute({ email: 'nao-e-email', password: 'Senha123' })
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('deve lançar InvalidCredentialsError — nunca expõe que o email não existe', async () => {
    userRepo = makeUserRepo(null) // banco retorna null
    sut = new LoginUseCase(userRepo, tokenRepo, hasher, tokenService)

    await expect(
      sut.execute({ email: 'naoexiste@email.com', password: 'Senha123' })
    ).rejects.toThrow(InvalidCredentialsError)
  })

  // ── Senha errada ───────────────────────────────────────────────────────────

  it('deve lançar InvalidCredentialsError para senha incorreta', async () => {
    hasher = makeHasher(false) // senha não bate
    sut = new LoginUseCase(userRepo, tokenRepo, hasher, tokenService)

    await expect(
      sut.execute({ email: 'adriano@email.com', password: 'SenhaErrada1' })
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('a mensagem de erro deve ser genérica — não revela se foi email ou senha', async () => {
    hasher = makeHasher(false)
    sut = new LoginUseCase(userRepo, tokenRepo, hasher, tokenService)

    await expect(
      sut.execute({ email: 'adriano@email.com', password: 'Errada1' })
    ).rejects.toThrow('Email ou senha inválidos')
  })

  // ── Usuário Google OAuth ───────────────────────────────────────────────────

  it('deve lançar InvalidCredentialsError para usuário que só tem login Google (sem senha)', async () => {
    const googleUser = makeUser({ passwordHash: undefined, googleId: 'google-123' })
    userRepo = makeUserRepo(googleUser)
    sut = new LoginUseCase(userRepo, tokenRepo, hasher, tokenService)

    await expect(
      sut.execute({ email: 'adriano@email.com', password: 'Senha123' })
    ).rejects.toThrow(InvalidCredentialsError)
  })

  // ── Admin ──────────────────────────────────────────────────────────────────

  it('deve retornar plano PREMIUM para usuário admin', async () => {
    const admin = makeUser({ role: UserRole.ADMIN, plan: Plan.FREE() }) // FREE passado, mas admin ignora
    userRepo = makeUserRepo(admin)
    sut = new LoginUseCase(userRepo, tokenRepo, hasher, tokenService)

    const result = await sut.execute({ email: 'adriano@email.com', password: 'Senha123' })

    expect(result.user.role).toBe(UserRole.ADMIN)
    expect(result.user.plan).toBe('PREMIUM') // admin sempre premium
  })

  // ── Não deve chamar o banco mais de uma vez ────────────────────────────────

  it('não deve buscar o usuário duas vezes', async () => {
    await sut.execute({ email: 'adriano@email.com', password: 'Senha123' })

    expect(userRepo.findByEmail).toHaveBeenCalledTimes(1)
  })
})