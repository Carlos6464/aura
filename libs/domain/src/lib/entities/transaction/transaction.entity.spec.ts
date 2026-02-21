import { describe, it, expect } from 'vitest';
import { Transaction } from './transaction.entity';
import { TransactionType, TransactionOrigin, Sentiment } from '../../enums';

describe('Transaction Entity', () => {
  const baseProps = {
    id: 't1',
    userId: 'u1',
    categoryId: 'c1',
    amount: 150.50,
    type: TransactionType.EXPENSE,
    date: new Date(),
    description: 'Jantar',
    origin: TransactionOrigin.MANUAL
  };

  it('deve marcar como deletada ao executar softDelete', () => {
    const tx = Transaction.create(baseProps);
    tx.softDelete();
    expect(tx.isDeleted).toBe(true);
    expect(tx.deletedAt).toBeInstanceOf(Date);
  });

  it('deve identificar transação impulsiva baseada na análise de IA', () => {
    const tx = Transaction.create(baseProps);
    tx.attachAiAnalysis({
      sentiment: Sentiment.IMPULSE,
      confidence: 0.95,
      tags: ['food'],
      emotionalTrigger: 'STRESS'
    });
    expect(tx.isImpulsive()).toBe(true);
  });
});