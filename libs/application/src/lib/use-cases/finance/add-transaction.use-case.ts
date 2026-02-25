import { Transaction, TransactionType, TransactionOrigin, Money } from '@aura/domain'
import { ITransactionRepository } from '../../ports/finance.ports'
import { IQueueService } from '../../ports/queue.ports'
import { randomUUID } from 'crypto'

export interface AddTransactionInput {
  userId: string
  categoryId: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  description: string
  date: Date
}

export class AddTransactionUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly queueService: IQueueService
  ) {}

  async execute(input: AddTransactionInput): Promise<Transaction> {
    // 1. Cria a entidade de Domínio com a origem MANUAL
    const transaction = Transaction.create({
      id: randomUUID(),
      userId: input.userId,
      categoryId: input.categoryId,
      amount: Money.of(input.amount).amount,
      type: input.type as TransactionType,
      description: input.description,
      date: input.date,
      origin: TransactionOrigin.MANUAL, // <-- AQUI ESTÁ A CORREÇÃO!
    })

    // 2. Salva no banco de dados
    await this.transactionRepo.save(transaction)

    // 3. Joga na FILA para o motor de IA/Comportamento analisar em background
    await this.queueService.publish('behavior_analysis_queue', 'TransactionCreated', {
      transactionId: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount.amount,
      type: transaction.type,
      description: transaction.description,
      origin: transaction.origin, // Opcional, mas bom mandar para a IA saber
    })

    return transaction
  }
}