import { Email, DomainError, RefreshToken } from '@aura/domain'
import {
  IUserRepository,
  IRefreshTokenRepository,
  IPasswordHasher,
  ITokenService,
  LoginInput,
  LoginOutput,
} from '../../ports/auth.ports'

// Erro genérico intencional — nunca revela se foi o email ou senha que errou
// Evita user enumeration attack
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Email ou senha inválidos')
    this.name = 'InvalidCredentialsError'
  }
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenRepo: IRefreshTokenRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Valida formato do email antes de ir ao banco
    let email: Email
    try {
      email = Email.of(input.email)
    } catch {
      throw new InvalidCredentialsError()
    }

    // 2. Busca usuário — erro genérico se não existir
    const user = await this.userRepo.findByEmail(email.value)
    if (!user) throw new InvalidCredentialsError()

    // 3. Usuário Google OAuth não tem senha — bloqueia login por email
    if (!user.hasPassword) throw new InvalidCredentialsError()

    // 4. Compara senha — erro genérico se não bater
    const match = await this.hasher.compare(input.password, user.passwordHash!)
    if (!match) throw new InvalidCredentialsError()

    // 5. Gera access token (JWT curto — 15min)
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      role: user.role,
    })

    // 6. Gera refresh token e salva só o hash no banco
    const rawRefreshToken = this.tokenService.generateRefreshToken()
    const tokenHash = this.tokenService.hashToken(rawRefreshToken)

    const refreshToken = RefreshToken.create({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    })

    await this.tokenRepo.save(refreshToken)

    // 7. Retorna o token puro ao cliente — única vez que sai do sistema
    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        role: user.role,
        plan: user.plan.type,
      },
    }
  }
}