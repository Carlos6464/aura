import { PlanType } from '../../enums'

export interface PlanLimits {
  whatsappMonthlyLimit: number  // -1 = ilimitado
  bankAppsLimit: number         // -1 = ilimitado
  allowOfx: boolean
  allowEmailGateway: boolean
  aiChatDailyLimit: number      // -1 = ilimitado
  aiTier: 'basic' | 'advanced'
  queuePriority: 'normal' | 'high'
}

export class Plan {
  private constructor(
    public readonly id: string,
    public readonly type: PlanType,
    public readonly name: string,
    public readonly stripePriceId: string | null,
    public readonly limits: PlanLimits,
  ) {}

  static create(props: {
    id: string
    type: PlanType
    name: string
    stripePriceId?: string
    limits: PlanLimits
  }): Plan {
    return new Plan(props.id, props.type, props.name, props.stripePriceId ?? null, props.limits)
  }

  static FREE(): Plan {
    return Plan.create({
      id: 'FREE',
      type: PlanType.FREE,
      name: 'Plano Free',
      limits: {
        whatsappMonthlyLimit: 10,
        bankAppsLimit: 1,
        allowOfx: false,
        allowEmailGateway: false,
        aiChatDailyLimit: 5,
        aiTier: 'basic',
        queuePriority: 'normal',
      },
    })
  }

  static PREMIUM(): Plan {
    return Plan.create({
      id: 'PREMIUM',
      type: PlanType.PREMIUM,
      name: 'Plano Premium',
      limits: {
        whatsappMonthlyLimit: -1,
        bankAppsLimit: -1,
        allowOfx: true,
        allowEmailGateway: true,
        aiChatDailyLimit: -1,
        aiTier: 'advanced',
        queuePriority: 'high',
      },
    })
  }

  isPremium(): boolean { return this.type === PlanType.PREMIUM }
}