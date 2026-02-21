import { InvalidOperationError } from '../errors/domain.errors'

export class Password {
  private constructor(private readonly _value: string) {}

  // Cria a partir do texto puro — valida regras, não faz hash (isso é infra)
  static create(raw: string): Password {
    const errors: string[] = []
    if (raw.length < 8)           errors.push('mínimo 8 caracteres')
    if (raw.length > 72)          errors.push('máximo 72 caracteres (limite bcrypt)')
    if (!/[A-Z]/.test(raw))       errors.push('pelo menos uma letra maiúscula')
    if (!/[a-z]/.test(raw))       errors.push('pelo menos uma letra minúscula')
    if (!/[0-9]/.test(raw))       errors.push('pelo menos um número')

    if (errors.length > 0) {
      throw new InvalidOperationError(`Senha inválida: ${errors.join(', ')}`)
    }
    return new Password(raw)
  }

  // Cria a partir de hash existente do banco — sem validação
  static fromHash(hash: string): Password {
    return new Password(hash)
  }

  get value(): string { return this._value }
  toString(): string { return '[protected]' }
}