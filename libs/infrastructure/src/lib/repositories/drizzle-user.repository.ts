import { eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { IUserRepository } from '@aura/application'
import { User, Plan, UserRole, PlanType } from '@aura/domain'
import { users } from '../schema/users.schema'


export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: PostgresJsDatabase) {}

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return row ? this._toDomain(row) : null
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return row ? this._toDomain(row) : null
  }

  async save(user: User): Promise<void> {
    await this.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email.value,
        passwordHash: user.passwordHash,
        googleId: user.googleId,
        whatsapp: user.whatsapp,
        avatarUrl: user.avatarUrl,
        role: user.role,
        planId: user.plan.id,
        monitoredApps: user.monitoredApps,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email.value,
          passwordHash: user.passwordHash,
          whatsapp: user.whatsapp,
          avatarUrl: user.avatarUrl,
          role: user.role,
          planId: user.plan.id,
          monitoredApps: user.monitoredApps,
        },
      })
  }

  private _toDomain(row: typeof users.$inferSelect): User {
    const plan = row.planId === 'PREMIUM' ? Plan.PREMIUM() : Plan.FREE()

    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash ?? undefined,
      googleId: row.googleId ?? undefined,
      whatsapp: row.whatsapp ?? undefined,
      avatarUrl: row.avatarUrl ?? undefined,
      role: row.role as UserRole,
      plan,
      monitoredApps: row.monitoredApps ?? [],
    })
  }
}