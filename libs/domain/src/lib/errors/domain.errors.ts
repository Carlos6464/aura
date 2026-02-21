export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidOperationError'
  }
}

export class EntityAlreadyDeletedError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} [${id}] já foi deletado`)
    this.name = 'EntityAlreadyDeletedError'
  }
}

export class PlanLimitExceededError extends DomainError {
  constructor(feature: string, limit: number) {
    super(`Limite atingido para "${feature}". Máximo: ${limit}. Faça upgrade para Premium.`)
    this.name = 'PlanLimitExceededError'
  }
}