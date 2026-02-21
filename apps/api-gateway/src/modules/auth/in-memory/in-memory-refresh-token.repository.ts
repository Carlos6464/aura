import { IRefreshTokenRepository } from '@aura/application'
import { RefreshToken } from '@aura/domain'

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly store = new Map<string, RefreshToken>()

  async save(token: RefreshToken): Promise<void> {
    this.store.set(token.tokenHash, token)
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.store.get(tokenHash) ?? null
  }

  async revokeAllFromUser(userId: string): Promise<void> {
    for (const token of this.store.values()) {
      if (token.userId === userId && token.isValid()) {
        token.revoke()
      }
    }
  }

  all(): RefreshToken[] { return [...this.store.values()] }
}