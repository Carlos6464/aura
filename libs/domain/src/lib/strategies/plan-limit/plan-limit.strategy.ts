import { Plan } from '../../entities/plan/plan.entity'
import { PlanLimitExceededError } from '../../errors/domain.errors'

// ── Contrato ──────────────────────────────────────────────────────────────────
// Cada feature tem um par can/assert — o guard chama assert(), que só lança se bloqueado
export interface PlanLimitStrategy {
  canUseWhatsapp(monthlyUsage: number): boolean
  canAddBankApp(currentCount: number): boolean
  canImportOfx(): boolean
  canUseEmailGateway(): boolean
  canUseAiChat(todayUsage: number): boolean

  assertWhatsapp(monthlyUsage: number): void
  assertBankApp(currentCount: number): void
  assertOfx(): void
  assertEmailGateway(): void
  assertAiChat(todayUsage: number): void
}

// ── Free ──────────────────────────────────────────────────────────────────────
export class FreePlanLimitStrategy implements PlanLimitStrategy {
  constructor(private readonly plan: Plan) {}

  canUseWhatsapp(u: number): boolean { return u < this.plan.limits.whatsappMonthlyLimit }
  canAddBankApp(c: number): boolean  { return c < this.plan.limits.bankAppsLimit }
  canImportOfx(): boolean            { return false }
  canUseEmailGateway(): boolean      { return false }
  canUseAiChat(u: number): boolean   { return u < this.plan.limits.aiChatDailyLimit }

  assertWhatsapp(u: number): void {
    if (!this.canUseWhatsapp(u)) throw new PlanLimitExceededError('WhatsApp Bot', this.plan.limits.whatsappMonthlyLimit)
  }
  assertBankApp(c: number): void {
    if (!this.canAddBankApp(c)) throw new PlanLimitExceededError('Apps monitorados', this.plan.limits.bankAppsLimit)
  }
  assertOfx(): void {
    throw new PlanLimitExceededError('Importação OFX', 0)
  }
  assertEmailGateway(): void {
    throw new PlanLimitExceededError('Email Gateway', 0)
  }
  assertAiChat(u: number): void {
    if (!this.canUseAiChat(u)) throw new PlanLimitExceededError('Chat IA', this.plan.limits.aiChatDailyLimit)
  }
}

// ── Premium ───────────────────────────────────────────────────────────────────
export class PremiumPlanLimitStrategy implements PlanLimitStrategy {
  canUseWhatsapp(_: number): boolean    { return true }
  canAddBankApp(_: number): boolean     { return true }
  canImportOfx(): boolean               { return true }
  canUseEmailGateway(): boolean         { return true }
  canUseAiChat(_: number): boolean      { return true }
  assertWhatsapp(_: number): void       {}
  assertBankApp(_: number): void        {}
  assertOfx(): void                     {}
  assertEmailGateway(): void            {}
  assertAiChat(_: number): void         {}
}

// ── Factory ───────────────────────────────────────────────────────────────────
// Ponto único — o resto do sistema só conhece PlanLimitStrategy
export class PlanLimitStrategyFactory {
  static create(plan: Plan): PlanLimitStrategy {
    return plan.isPremium()
      ? new PremiumPlanLimitStrategy()
      : new FreePlanLimitStrategy(plan)
  }
}