import { Money } from '../../value-objects/money.vo'
import { TransactionOrigin, TransactionType, Sentiment } from '../../enums'
import { EntityAlreadyDeletedError, InvalidOperationError } from '../../errors/domain.errors'

export interface AiAnalysis {
  sentiment: Sentiment
  confidence: number
  tags: string[]
  emotionalTrigger: string | null
}

export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly categoryId: string,
    private readonly _amount: Money,
    public readonly type: TransactionType,
    public readonly date: Date,
    public readonly description: string,
    public readonly origin: TransactionOrigin,
    private _aiAnalysis: AiAnalysis | null,
    private _deletedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string
    userId: string
    categoryId: string
    amount: number
    type: TransactionType
    date: Date
    description: string
    origin: TransactionOrigin
  }): Transaction {
    return new Transaction(
      props.id, props.userId, props.categoryId,
      Money.of(props.amount), props.type, props.date,
      props.description, props.origin, null, null, new Date(),
    )
  }

  attachAiAnalysis(analysis: AiAnalysis): void {
    if (this._aiAnalysis) {
      throw new InvalidOperationError(`Transação [${this.id}] já possui análise de IA`)
    }
    this._aiAnalysis = analysis
  }

  softDelete(): void {
    if (this._deletedAt) throw new EntityAlreadyDeletedError('Transaction', this.id)
    this._deletedAt = new Date()
  }

  // Regras de negócio encapsuladas — usadas pelos Observers e Strategies
  isImpulsive(): boolean { return this._aiAnalysis?.sentiment === Sentiment.IMPULSE }
  isLateNight(): boolean { const h = this.date.getHours(); return h >= 22 || h <= 5 }
  isWeekend(): boolean { const d = this.date.getDay(); return d === 0 || d === 6 }
  isHighValue(threshold: Money): boolean { return this._amount.isGreaterThan(threshold) }
  wasAnalyzed(): boolean { return this._aiAnalysis !== null }

  get amount(): Money { return this._amount }
  get aiAnalysis(): AiAnalysis | null { return this._aiAnalysis }
  get isDeleted(): boolean { return this._deletedAt !== null }
  get deletedAt(): Date | null { return this._deletedAt }
}