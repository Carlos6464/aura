import { eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { IRefreshTokenRepository } from '@aura/application'
import { RefreshToken } from '@aura/domain'
import { refreshTokens } from '../schema/refresh-tokens.schema'

export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: PostgresJsDatabase) {}

  async save(token: RefreshToken): Promise<void> {
    await this.db.insert(refreshTokens).values({
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    })
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)

    if (!row) return null

    return RefreshToken.create({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
    })
  }

  async revokeAllFromUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId))
  }
}