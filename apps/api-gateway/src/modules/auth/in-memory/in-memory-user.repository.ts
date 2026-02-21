import { IUserRepository } from '@aura/application'
import { User, Plan, UserRole } from '@aura/domain'

// Seed com um usuário de teste para facilitar o desenvolvimento
// Senha: Aura@2026 — o FakePasswordHasher compara em texto puro
const SEED_USERS: User[] = [
  User.create({
    id: 'user-seed-1',
    email: 'adriano@aura.com',
    passwordHash: 'Aura@2026',  // FakePasswordHasher não faz hash real
    plan: Plan.FREE(),
    role: UserRole.USER,
  }),
  User.create({
    id: 'admin-seed-1',
    email: 'admin@aura.com',
    passwordHash: 'Admin@2026',
    plan: Plan.FREE(),           // admin ignora o plano e força PREMIUM
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

  // Utilitário para inspecionar o estado nos testes
  all(): User[] { return [...this.store.values()] }
}