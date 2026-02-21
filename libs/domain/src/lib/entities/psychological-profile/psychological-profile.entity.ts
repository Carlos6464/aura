import { EmotionalTrigger, ConsciousnessStage } from '../../enums'
import { BehavioralPattern } from '../behavioral-pattern/behavioral-pattern.entity'
import { Trigger } from '../trigger/trigger.entity'

export class PsychologicalProfile {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _dominantTrigger: EmotionalTrigger | null,
    private _impulseScore: number,
    private _consciousnessStage: ConsciousnessStage,
    private _patterns: BehavioralPattern[],
    private _triggers: Trigger[],
    private _totalAdvicesSent: number,
    private _positiveOutcomes: number,
    private _updatedAt: Date,
    public readonly createdAt: Date,
  ) {}

  static create(props: { id: string; userId: string }): PsychologicalProfile {
    const now = new Date()
    return new PsychologicalProfile(props.id, props.userId, null, 0, ConsciousnessStage.UNAWARE, [], [], 0, 0, now, now)
  }

  // Média móvel exponencial — suaviza flutuações de um gasto isolado
  updateImpulseScore(wasImpulsive: boolean): void {
    const alpha = 0.1
    this._impulseScore = alpha * (wasImpulsive ? 1 : 0) + (1 - alpha) * this._impulseScore
    this._recalculateStage()
    this._updatedAt = new Date()
  }

  addPattern(pattern: BehavioralPattern): void {
    if (!this._patterns.find(p => p.id === pattern.id)) {
      this._patterns = [...this._patterns, pattern]
    }
    this._recalculateDominantTrigger()
    this._updatedAt = new Date()
  }

  addTrigger(trigger: Trigger): void {
    const existing = this._triggers.find(t => t.type === trigger.type)
    existing ? existing.reinforce() : (this._triggers = [...this._triggers, trigger])
    this._recalculateDominantTrigger()
    this._updatedAt = new Date()
  }

  recordAdviceSent(): void { 
  this._totalAdvicesSent++; 
  this._recalculateStage(); // Adicione esta linha
  this._updatedAt = new Date(); 
}

  recordPositiveOutcome(): void {
    this._positiveOutcomes++
    this._recalculateStage()
    this._updatedAt = new Date()
  }

  private _recalculateDominantTrigger(): void {
    if (!this._triggers.length) return
    const sorted = [...this._triggers].sort((a, b) => b.frequency - a.frequency)
    this._dominantTrigger = sorted[0].type
  }

  private _recalculateStage(): void {
    const rate = this._totalAdvicesSent > 0 ? this._positiveOutcomes / this._totalAdvicesSent : 0
    if (this._impulseScore < 0.2 && rate >= 0.7)   this._consciousnessStage = ConsciousnessStage.AUTONOMOUS
    else if (rate >= 0.4)                           this._consciousnessStage = ConsciousnessStage.CHANGING
    else if (this._totalAdvicesSent >= 3)           this._consciousnessStage = ConsciousnessStage.AWARE
    else                                            this._consciousnessStage = ConsciousnessStage.UNAWARE
  }

  isHighlyImpulsive(): boolean { return this._impulseScore >= 0.7 }
  successRate(): number {
    return this._totalAdvicesSent === 0 ? 0 : this._positiveOutcomes / this._totalAdvicesSent
  }

  get dominantTrigger(): EmotionalTrigger | null { return this._dominantTrigger }
  get impulseScore(): number { return this._impulseScore }
  get consciousnessStage(): ConsciousnessStage { return this._consciousnessStage }
  get patterns(): BehavioralPattern[] { return [...this._patterns] }
  get triggers(): Trigger[] { return [...this._triggers] }
  get totalAdvicesSent(): number { return this._totalAdvicesSent }
  get positiveOutcomes(): number { return this._positiveOutcomes }
  get updatedAt(): Date { return this._updatedAt }
}