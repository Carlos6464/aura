import { Money } from '../../value-objects/money.vo'
import { EmotionalTrigger } from '../../enums'

export interface PatternOccurrence {
  transactionId: string
  amount: number
  date: Date
  description: string
}

export class BehavioralPattern {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly trigger: EmotionalTrigger,
    private _occurrences: PatternOccurrence[],
    private _avgAmount: Money,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: {
    id: string
    userId: string
    name: string
    trigger: EmotionalTrigger
    firstOccurrence: PatternOccurrence
  }): BehavioralPattern {
    const now = new Date()
    return new BehavioralPattern(
      props.id, props.userId, props.name, props.trigger,
      [props.firstOccurrence], Money.of(props.firstOccurrence.amount), now, now,
    )
  }

  addOccurrence(occurrence: PatternOccurrence): void {
    this._occurrences = [...this._occurrences, occurrence]
    const total = this._occurrences.reduce((s, o) => s + o.amount, 0)
    this._avgAmount = Money.of(total / this._occurrences.length)
    this._updatedAt = new Date()
  }

  monthlyCost(): Money {
    const now = new Date()
    const total = this._occurrences
      .filter(o => o.date.getMonth() === now.getMonth() && o.date.getFullYear() === now.getFullYear())
      .reduce((s, o) => s + o.amount, 0)
    return Money.of(total)
  }

  isStrong(): boolean { return this._occurrences.length >= 5 }

  get occurrenceCount(): number { return this._occurrences.length }
  get occurrences(): PatternOccurrence[] { return [...this._occurrences] }
  get avgAmount(): Money { return this._avgAmount }
  get updatedAt(): Date { return this._updatedAt }
}