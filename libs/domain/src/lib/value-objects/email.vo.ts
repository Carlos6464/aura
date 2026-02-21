import { InvalidOperationError } from '../errors/domain.errors'

export class Email {
  private constructor(private readonly _value: string) {}

  static of(value: string): Email {
    const trimmed = value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new InvalidOperationError(`Email inválido: ${value}`)
    }
    return new Email(trimmed)
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  get value(): string { return this._value }
  toString(): string { return this._value }
}