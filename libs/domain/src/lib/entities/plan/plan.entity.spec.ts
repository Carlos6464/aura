import { describe, it, expect } from 'vitest';
import { Plan } from './plan.entity';
import { PlanType } from '../../enums';

describe('Plan Entity', () => {
  it('deve criar uma instância de plano com as propriedades corretas', () => {
    const limits = {
      whatsappMonthlyLimit: 50,
      bankAppsLimit: 2,
      allowOfx: true,
      allowEmailGateway: false,
      aiChatDailyLimit: 10,
      aiTier: 'basic' as const,
      queuePriority: 'normal' as const,
    };

    const plan = Plan.create({
      id: 'custom-plan',
      type: PlanType.FREE,
      name: 'Plano Customizado',
      limits
    });

    expect(plan.id).toBe('custom-plan');
    expect(plan.name).toBe('Plano Customizado');
    expect(plan.limits.whatsappMonthlyLimit).toBe(50);
  });

  it('deve criar corretamente um plano FREE com os limites padrão', () => {
    const freePlan = Plan.FREE();

    expect(freePlan.type).toBe(PlanType.FREE);
    expect(freePlan.isPremium()).toBe(false);
    expect(freePlan.limits.bankAppsLimit).toBe(1);
    expect(freePlan.limits.allowOfx).toBe(false);
  });

  it('deve criar corretamente um plano PREMIUM com limites ilimitados', () => {
    const premiumPlan = Plan.PREMIUM();

    expect(premiumPlan.type).toBe(PlanType.PREMIUM);
    expect(premiumPlan.isPremium()).toBe(true);
    expect(premiumPlan.limits.whatsappMonthlyLimit).toBe(-1); // -1 representa ilimitado
    expect(premiumPlan.limits.allowOfx).toBe(true);
    expect(premiumPlan.limits.aiTier).toBe('advanced');
  });

  it('deve identificar corretamente se o plano é premium ou não', () => {
    const freePlan = Plan.FREE();
    const premiumPlan = Plan.PREMIUM();

    expect(freePlan.isPremium()).toBe(false);
    expect(premiumPlan.isPremium()).toBe(true);
  });
});