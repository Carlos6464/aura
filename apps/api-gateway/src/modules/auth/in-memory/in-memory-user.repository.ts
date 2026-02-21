import { IUserRepository } from '@aura/application'
import { User, Plan, UserRole } from '@aura/domain'

const SEED_USERS: User[] = [
  User.create({
    id: 'user-seed-1',
    email: 'adriano@aura.com',
    passwordHash: 'Aura@2026',
    plan: Plan.FREE(),
    role: UserRole.USER,
  }),
  User.create({
    id: 'admin-seed-1',
    email: 'admin@aura.com',
    passwordHash: 'Admin@2026',
    plan: Plan.FREE(),
    role: UserRole.ADMIN,
  }),
]

export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>(
    SEED_USERS.map(u => [u.id, u])
  )

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.value === email) return user
    }
    return null
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null
  }

  async save(user: User): Promise<void> {
    this.store.set(user.id, user)
  }

  all(): User[] { return [...this.store.values()] }
}