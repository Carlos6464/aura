import { Transaction } from '@aura/domain'

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>
  findById(id: string): Promise<Transaction | null>
  // No futuro colocaremos findByUserId, etc.
}