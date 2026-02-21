import { AdviceChannel, AdviceOutcome, InterventionType } from '../../enums'
import { InvalidOperationError } from '../../errors/domain.errors'

export class Advice {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly transactionId: string | null,
    public readonly interventionType: InterventionType,
    public readonly channel: AdviceChannel,
    public readonly content: string,
    public readonly sentAt: Date,
    private _readAt: Date | null,
    private _outcome: AdviceOutcome,
    private _outcomeAt: Date | null,
    private _outcomeNote: string | null,
  ) {}

  static create(props: {
    id: string
    userId: string
    transactionId?: string
    interventionType: InterventionType
    channel: AdviceChannel
    content: string
  }): Advice {
    return new Advice(
      props.id, props.userId, props.transactionId ?? null,
      props.interventionType, props.channel, props.content,
      new Date(), null, AdviceOutcome.PENDING, null, null,
    )
  }

  markAsRead(): void { if (!this._readAt) this._readAt = new Date() }

  recordOutcome(outcome: Exclude<AdviceOutcome, AdviceOutcome.PENDING>, note?: string): void {
    if (this._outcome !== AdviceOutcome.PENDING) {
      throw new InvalidOperationError(`Conselho [${this.id}] já tem resultado registrado`)
    }
    this._outcome = outcome
    this._outcomeAt = new Date()
    this._outcomeNote = note ?? null
  }

  wasSuccessful(): boolean { return this._outcome === AdviceOutcome.POSITIVE }
  isPending(): boolean { return this._outcome === AdviceOutcome.PENDING }

  get readAt(): Date | null { return this._readAt }
  get outcome(): AdviceOutcome { return this._outcome }
  get outcomeAt(): Date | null { return this._outcomeAt }
  get outcomeNote(): string | null { return this._outcomeNote }
}