// libs/application/src/lib/use-cases/auth/refresh-token.use-case.ts
import { RefreshToken, DomainError } from '@aura/domain';
import { IRefreshTokenRepository, IUserRepository, ITokenService } from '../../ports/auth.ports';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(rawToken: string) {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const refreshToken = await this.tokenRepo.findByHash(tokenHash);

    if (!refreshToken || !refreshToken.isValid()) {
      throw new DomainError('Token de atualização inválido ou expirado');
    }

    const user = await this.userRepo.findById(refreshToken.userId);
    if (!user) throw new DomainError('Usuário não encontrado');

    // Revoga o token atual (rotação de tokens para segurança)
    refreshToken.revoke();
    await this.tokenRepo.save(refreshToken);

    // Gera novos tokens
    const accessToken = this.tokenService.generateAccessToken({ sub: user.id, role: user.role });
    const newRawRefreshToken = this.tokenService.generateRefreshToken();
    
    const newRefreshToken = RefreshToken.create({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: this.tokenService.hashToken(newRawRefreshToken),
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });

    await this.tokenRepo.save(newRefreshToken);

    return { accessToken, refreshToken: newRawRefreshToken };
  }
}