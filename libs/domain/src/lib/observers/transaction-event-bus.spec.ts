// libs/domain/src/lib/observers/transaction-event-bus.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { TransactionEventBus } from './transaction-event-bus'
import { Transaction } from '../entities/transaction/transaction.entity'
import { TransactionType, TransactionOrigin } from '../enums'

describe('TransactionEventBus', () => {
  const makeTx = () => Transaction.create({
    id: 't1', userId: 'u1', categoryId: 'c1', amount: 100,
    type: TransactionType.EXPENSE, date: new Date(),
    description: 'Teste', origin: TransactionOrigin.MANUAL
  })

  it('deve notificar todos os observers inscritos', async () => {
    const bus = new TransactionEventBus()
    const observer = { name: 'Mock', onTransactionRegistered: vi.fn().mockResolvedValue(undefined) }
    
    bus.subscribe(observer)
    await bus.publish(makeTx())
    
    expect(observer.onTransactionRegistered).toHaveBeenCalled()
  })

  it('falha em um observer não deve afetar os outros', async () => {
    const bus = new TransactionEventBus()
    const obs1 = { name: 'Fail', onTransactionRegistered: vi.fn().mockRejectedValue(new Error('Erro!')) }
    const obs2 = { name: 'Success', onTransactionRegistered: vi.fn().mockResolvedValue(undefined) }
    
    bus.subscribe(obs1)
    bus.subscribe(obs2)
    
    await expect(bus.publish(makeTx())).resolves.not.toThrow()
    expect(obs2.onTransactionRegistered).toHaveBeenCalled()
  })
})