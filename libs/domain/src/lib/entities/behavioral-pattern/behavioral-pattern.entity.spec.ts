// lib/entities/behavioral-pattern/behavioral-pattern.entity.spec.ts
import { describe, it, expect } from 'vitest'
import { BehavioralPattern } from './behavioral-pattern.entity'
import { EmotionalTrigger } from '../../enums'

describe('BehavioralPattern Entity', () => {
  const firstOccurrence = {
    transactionId: 't1',
    amount: 100,
    date: new Date(),
    description: 'iFood'
  }

  it('deve calcular a média de valor corretamente ao adicionar ocorrências', () => {
    const pattern = BehavioralPattern.create({
      id: 'p1',
      userId: 'u1',
      name: 'Delivery Noturno',
      trigger: EmotionalTrigger.BOREDOM,
      firstOccurrence
    })

    pattern.addOccurrence({ ...firstOccurrence, amount: 200 })
    
    expect(pattern.occurrenceCount).toBe(2)
    expect(pattern.avgAmount.amount).toBe(150) // (100 + 200) / 2
  })

  it('deve identificar como padrão forte após 5 ocorrências', () => {
    const pattern = BehavioralPattern.create({
      id: 'p1', userId: 'u1', name: 'Teste', 
      trigger: EmotionalTrigger.STRESS, firstOccurrence
    })

    for (let i = 0; i < 4; i++) pattern.addOccurrence(firstOccurrence)
    
    expect(pattern.isStrong()).toBe(true)
  })
})