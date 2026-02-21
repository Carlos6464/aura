import { InvalidOperationError } from '../errors/domain.errors'

export class Money {
  private constructor(private readonly _amount: number) {}

  static of(amount: number): Money {
    if (amount < 0) throw new InvalidOperationError(`Money não pode ser negativo: ${amount}`)
    return new Money(Math.round(amount * 100) / 100)
  }

  static zero(): Money {
    return new Money(0)
  }

  add(other: Money): Money {
    return Money.of(this._amount + other._amount)
  }

  subtract(other: Money): Money {
    return Money.of(this._amount - other._amount)
  }

  multiply(factor: number): Money {
    return Money.of(this._amount * factor)
  }

  isGreaterThan(other: Money): boolean {
    return this._amount > other._amount
  }

  isZero(): boolean {
    return this._amount === 0
  }

  equals(other: Money): boolean {
    return this._amount === other._amount
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this._amount)
  }

  get amount(): number { return this._amount }
  toString(): string { return this.format() }
}