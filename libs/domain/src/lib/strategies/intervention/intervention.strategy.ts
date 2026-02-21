import { Transaction } from '../../entities/transaction/transaction.entity'
import { PsychologicalProfile } from '../../entities/psychological-profile/psychological-profile.entity'
import { InterventionType } from '../../enums'

// ── Contrato ──────────────────────────────────────────────────────────────────
export interface InterventionStrategy {
  readonly type: InterventionType
  shouldTrigger(tx: Transaction, profile: PsychologicalProfile): boolean
  buildMessage(tx: Transaction, profile: PsychologicalProfile): string
}

// ── 1. Preventiva ─────────────────────────────────────────────────────────────
// Detecta padrão de risco antes de se consolidar
export class PreventiveInterventionStrategy implements InterventionStrategy {
  readonly type = InterventionType.PREVENTIVE

  shouldTrigger(tx: Transaction, profile: PsychologicalProfile): boolean {
    return tx.isImpulsive() && tx.isLateNight() && profile.impulseScore >= 0.5
  }

  buildMessage(tx: Transaction, profile: PsychologicalProfile): string {
    const trigger = profile.dominantTrigger?.toLowerCase() ?? 'hábito'
    return (
      `Oi! Notei um gasto de ${tx.amount.format()} agora à noite. ` +
      `Costuma acontecer quando você está com ${trigger}. Ainda quer confirmar? 😊`
    )
  }
}

// ── 2. Educativa ──────────────────────────────────────────────────────────────
// Ensina conceito financeiro relevante ao contexto
export class EducationalInterventionStrategy implements InterventionStrategy {
  readonly type = InterventionType.EDUCATIONAL

  shouldTrigger(tx: Transaction, profile: PsychologicalProfile): boolean {
    return (
      tx.isImpulsive() &&
      profile.patterns.some(p => p.isStrong()) &&
      profile.consciousnessStage !== 'AUTONOMOUS'
    )
  }

  buildMessage(tx: Transaction, profile: PsychologicalProfile): string {
    const pattern = profile.patterns.find(p => p.isStrong())
    const cost = pattern?.monthlyCost().format() ?? tx.amount.format()
    return (
      `Esse padrão de gastos está custando ~${cost}/mês. ` +
      `Se fosse para uma reserva de emergência, em 6 meses você teria uma base sólida. 💡`
    )
  }
}

// ── 3. Celebratória ───────────────────────────────────────────────────────────
// Reforço positivo quando o usuário quebra um padrão ruim
export class CelebratoryInterventionStrategy implements InterventionStrategy {
  readonly type = InterventionType.CELEBRATORY

  shouldTrigger(tx: Transaction, profile: PsychologicalProfile): boolean {
    return !tx.isImpulsive() && profile.isHighlyImpulsive() && !tx.isLateNight()
  }

  buildMessage(tx: Transaction, _profile: PsychologicalProfile): string {
    return (
      `Boa escolha com ${tx.description}! ` +
      `Percebe a diferença quando você decide com calma? Isso é progresso real. 🎉`
    )
  }
}

// ── 4. Reflexiva ──────────────────────────────────────────────────────────────
// Pós-gasto, sem julgamento — convida à auto-observação
export class ReflectiveInterventionStrategy implements InterventionStrategy {
  readonly type = InterventionType.REFLECTIVE

  shouldTrigger(tx: Transaction, profile: PsychologicalProfile): boolean {
    return tx.isImpulsive() && !tx.isLateNight() && profile.successRate() < 0.3
  }

  buildMessage(tx: Transaction, _profile: PsychologicalProfile): string {
    return (
      `${tx.amount.format()} em ${tx.description}. ` +
      `Como você se sentiu depois? Perceber isso já é o primeiro passo. 🤔`
    )
  }
}