// libs/domain/src/lib/strategies/plan-limit/plan-limit.strategy.spec.ts
import { describe, it, expect } from 'vitest'
import { PlanLimitStrategyFactory } from './plan-limit.strategy'
import { Plan } from '../../entities/plan/plan.entity'

describe('PlanLimitStrategy', () => {
  it('Plano FREE deve bloquear importação OFX', () => {
    const strategy = PlanLimitStrategyFactory.create(Plan.FREE())
    expect(() => strategy.assertOfx()).toThrow(/Limite atingido para "Importação OFX"/)
  })

  it('Plano FREE deve respeitar limite do WhatsApp', () => {
    const strategy = PlanLimitStrategyFactory.create(Plan.FREE())
    expect(strategy.canUseWhatsapp(5)).toBe(true)
    expect(strategy.canUseWhatsapp(11)).toBe(false)
  })

  it('Plano PREMIUM não deve ter bloqueios', () => {
    const strategy = PlanLimitStrategyFactory.create(Plan.PREMIUM())
    expect(() => strategy.assertOfx()).not.toThrow()
    expect(strategy.canUseAiChat(999)).toBe(true)
  })
})