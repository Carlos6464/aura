// domain/src/lib/entities/__tests__/user.entity.spec.ts
import { describe, it, expect } from 'vitest'
import { User } from '../user/user.entity'
import { Plan } from '../plan/plan.entity'
import { UserRole } from '../../enums'

describe('User Entity', () => {
  it('deve criar um usuário com plano FREE por padrão', () => {
    const user = User.create({
      id: 'u1',
      email: 'teste@aura.com',
      plan: Plan.FREE()
    })

    expect(user.plan.type).toBe('FREE')
    expect(user.role).toBe(UserRole.USER)
  })

  it('deve forçar plano PREMIUM se o usuário for ADMIN', () => {
    const user = User.create({
      id: 'admin1',
      email: 'admin@aura.com',
      plan: Plan.FREE(), // Tentando passar free
      role: UserRole.ADMIN
    })

    expect(user.plan.type).toBe('PREMIUM')
    expect(user.isAdmin()).toBe(true)
  })

  it('deve lançar erro ao exceder limite de apps no plano FREE', () => {
    const user = User.create({
      id: 'u2',
      email: 'user@aura.com',
      plan: Plan.FREE() // Limite é 1 app
    })

    user.addMonitoredApp('com.nubank')
    
    expect(() => {
      user.addMonitoredApp('com.inter')
    }).toThrow('permite apenas 1 app(s)')
  })
})