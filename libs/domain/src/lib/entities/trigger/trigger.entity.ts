import { EmotionalTrigger } from '../../enums'

export class Trigger {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: EmotionalTrigger,
    public readonly description: string,
    public readonly context: string[],
    private _frequency: number,
    private _lastDetectedAt: Date,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string
    userId: string
    type: EmotionalTrigger
    description: string
    context: string[]
  }): Trigger {
    const now = new Date()
    return new Trigger(props.id, props.userId, props.type, props.description, props.context, 1, now, now)
  }

  reinforce(): void {
    this._frequency++
    this._lastDetectedAt = new Date()
  }

  isRecurrent(): boolean { return this._frequency >= 3 }
  isDominant(): boolean { return this._frequency >= 7 }

  get frequency(): number { return this._frequency }
  get lastDetectedAt(): Date { return this._lastDetectedAt }
}