import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddTransactionUseCase } from './add-transaction.use-case'
import { ITransactionRepository } from '../../ports/finance.ports'
import { IQueueService } from '../../ports/queue.ports'
import { TransactionType, TransactionOrigin } from '@aura/domain'

describe('AddTransactionUseCase', () => {
  let transactionRepo: ITransactionRepository
  let queueService: IQueueService
  let sut: AddTransactionUseCase

  beforeEach(() => {
    transactionRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
    }
    queueService = {
      publish: vi.fn().mockResolvedValue(undefined),
    }

    sut = new AddTransactionUseCase(transactionRepo, queueService)
  })

  it('deve criar uma transação manual, salvar no banco e publicar o evento na fila', async () => {
    const input = {
      userId: 'user-123',
      categoryId: 'cat-456',
      amount: 150.5,
      type: 'EXPENSE' as TransactionType,
      description: 'Compra de livros de psicologia',
      date: new Date('2026-02-24T12:00:00Z'),
    }

    const result = await sut.execute(input)

    // Verifica a Entidade retornada
    expect(result.id).toBeDefined()
    expect(result.userId).toBe('user-123')
    expect(result.origin).toBe(TransactionOrigin.MANUAL)
    
    // Como o getter .amount devolve a classe Money, nós acessamos a propriedade primitiva para testar
    expect(result.amount.amount).toBe(150.5)

    // Verifica se salvou no banco
    expect(transactionRepo.save).toHaveBeenCalledTimes(1)
    expect(transactionRepo.save).toHaveBeenCalledWith(result)

    // Verifica se a mensagem foi para a fila com os dados primitivos corretos
    expect(queueService.publish).toHaveBeenCalledTimes(1)
    expect(queueService.publish).toHaveBeenCalledWith(
      'behavior_analysis_queue',
      'TransactionCreated',
      expect.objectContaining({
        transactionId: result.id,
        userId: 'user-123',
        amount: 150.5, // A fila deve receber o número, não o objeto Money
        description: 'Compra de livros de psicologia',
        origin: TransactionOrigin.MANUAL,
      })
    )
  })
})