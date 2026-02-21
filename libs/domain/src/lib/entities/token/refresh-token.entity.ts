import { InvalidOperationError } from '../../errors/domain.errors'

export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private readonly _tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    private _revokedAt: Date | null,
  ) {}

  static create(props: {
    id: string
    userId: string
    tokenHash: string
    expiresAt: Date
  }): RefreshToken {
    if (props.expiresAt <= new Date()) {
      throw new InvalidOperationError('Data de expiração deve ser futura')
    }
    return new RefreshToken(props.id, props.userId, props.tokenHash, props.expiresAt, new Date(), null)
  }

  revoke(): void {
    if (this._revokedAt) throw new InvalidOperationError(`RefreshToken [${this.id}] já foi revogado`)
    this._revokedAt = new Date()
  }

  isExpired(): boolean { return new Date() > this.expiresAt }
  isRevoked(): boolean { return this._revokedAt !== null }
  isValid(): boolean { return !this.isExpired() && !this.isRevoked() }

  get tokenHash(): string { return this._tokenHash }
  get revokedAt(): Date | null { return this._revokedAt }
}