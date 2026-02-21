// libs/domain/src/lib/value-objects/vo.spec.ts
import { describe, it, expect } from 'vitest'
import { Email } from './email.vo'
import { Money } from './money.vo'
import { Password } from './password.vo'

describe('Value Objects', () => {
  describe('Email', () => {
    it('deve normalizar e validar um email correto', () => {
      const email = Email.of(' ADRIANO@email.com ')
      expect(email.value).toBe('adriano@email.com')
    })

    it('deve lançar erro para email inválido', () => {
      expect(() => Email.of('email-invalido')).toThrow(/Email inválido/)
    })
  })

  describe('Money', () => {
    it('deve realizar operações aritméticas corretamente', () => {
      const m1 = Money.of(100)
      const m2 = Money.of(50.50)
      expect(m1.add(m2).amount).toBe(150.50)
      expect(m1.subtract(m2).amount).toBe(49.50)
    })

    it('deve formatar para BRL', () => {
      const m = Money.of(1250.5)
      expect(m.format()).toContain('R$')
    })
  })

  describe('Password', () => {
    it('deve validar regras de complexidade', () => {
      expect(() => Password.create('curta1A')).toThrow(/mínimo 8 caracteres/)
      expect(() => Password.create('senhasemnumeroA')).toThrow(/pelo menos um número/)
      expect(Password.create('Aura@2026').value).toBe('Aura@2026')
    })

    it('deve mascarar a senha no toString', () => {
      const p = Password.create('Aura@2026')
      expect(p.toString()).toBe('[protected]')
    })
  })
})