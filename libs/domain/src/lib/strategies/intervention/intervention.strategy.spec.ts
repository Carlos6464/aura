import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  PreventiveInterventionStrategy, 
  EducationalInterventionStrategy,
  CelebratoryInterventionStrategy,
  ReflectiveInterventionStrategy 
} from './intervention.strategy'
import { Transaction } from '../../entities/transaction/transaction.entity'
import { PsychologicalProfile } from '../../entities/psychological-profile/psychological-profile.entity'
import { TransactionType, TransactionOrigin, Sentiment } from '../../enums'

describe('Intervention Strategies', () => {
  let profile: PsychologicalProfile
  
  // Helpers para garantir horários controlados
  const DAY_TIME = new Date('2026-01-20T14:00:00')
  const NIGHT_TIME = new Date('2026-01-20T23:00:00')

  const makeTx = (amount: number, sentiment: Sentiment, date: Date) => {
    const tx = Transaction.create({
      id: 'tx-1', userId: 'u1', categoryId: 'cat-1',
      amount, type: TransactionType.EXPENSE,
      date: date, description: 'Compra Teste', origin: TransactionOrigin.MANUAL
    })
    tx.attachAiAnalysis({
      sentiment, confidence: 0.9, tags: [], emotionalTrigger: 'STRESS'
    })
    return tx
  }

  beforeEach(() => {
    profile = PsychologicalProfile.create({ id: 'prof-1', userId: 'u1' })
  })

  describe('PreventiveInterventionStrategy', () => {
    it('deve disparar para gasto impulsivo à noite com score alto', () => {
      const strategy = new PreventiveInterventionStrategy()
      const tx = makeTx(100, Sentiment.IMPULSE, NIGHT_TIME)
      
      for(let i=0; i<10; i++) profile.updateImpulseScore(true)

      expect(strategy.shouldTrigger(tx, profile)).toBe(true)
      expect(strategy.buildMessage(tx, profile)).toContain('quer confirmar?')
    })
  })

  describe('CelebratoryInterventionStrategy', () => {
    it('deve celebrar quando usuário impulsivo faz compra necessária de dia', () => {
      const strategy = new CelebratoryInterventionStrategy()
      // !isImpulsive (NECESSARY) && de dia && highlyImpulsive
      const tx = makeTx(100, Sentiment.NECESSARY, DAY_TIME)
      
      // Eleva o score do perfil para > 0.7
      for(let i=0; i<20; i++) profile.updateImpulseScore(true)

      expect(profile.isHighlyImpulsive()).toBe(true)
      expect(strategy.shouldTrigger(tx, profile)).toBe(true)
      expect(strategy.buildMessage(tx, profile)).toContain('Boa escolha')
    })
  })

  describe('ReflectiveInterventionStrategy', () => {
    it('deve disparar para gastos impulsivos diurnos com baixa taxa de sucesso', () => {
      const strategy = new ReflectiveInterventionStrategy()
      const tx = makeTx(100, Sentiment.IMPULSE, DAY_TIME)

      // Simula 10 conselhos onde nenhum foi positivo (taxa 0%)
      for(let i=0; i<10; i++) profile.recordAdviceSent()

      expect(profile.successRate()).toBe(0)
      expect(strategy.shouldTrigger(tx, profile)).toBe(true)
      const message = strategy.buildMessage(tx, profile)
      expect(message).toContain('Como você se sentiu')
    })
  })
})