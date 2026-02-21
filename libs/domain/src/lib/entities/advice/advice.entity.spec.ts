// lib/entities/advice/advice.entity.spec.ts
import { describe, it, expect } from 'vitest'
import { Advice } from './advice.entity'
import { AdviceChannel, AdviceOutcome, InterventionType } from '../../enums'

describe('Advice Entity', () => {
  const createAdvice = () => Advice.create({
    id: 'adv-1',
    userId: 'user-1',
    interventionType: InterventionType.REFLECTIVE,
    channel: AdviceChannel.WHATSAPP,
    content: 'Você realmente precisa disso agora?'
  })

  it('deve criar um conselho com status PENDING por padrão', () => {
    const advice = createAdvice()
    expect(advice.isPending()).toBe(true)
    expect(advice.outcome).toBe(AdviceOutcome.PENDING)
  })

  it('deve registrar a leitura do conselho', () => {
    const advice = createAdvice()
    advice.markAsRead()
    expect(advice.readAt).toBeInstanceOf(Date)
  })

  it('deve registrar um resultado positivo e marcar como sucesso', () => {
    const advice = createAdvice()
    advice.recordOutcome(AdviceOutcome.POSITIVE, 'Obrigado, me ajudou!')
    
    expect(advice.wasSuccessful()).toBe(true)
    expect(advice.outcomeNote).toBe('Obrigado, me ajudou!')
  })

  it('deve lançar erro ao tentar alterar um resultado já registrado', () => {
    const advice = createAdvice()
    advice.recordOutcome(AdviceOutcome.IGNORED)
    
    expect(() => advice.recordOutcome(AdviceOutcome.POSITIVE))
      .toThrow(/já tem resultado registrado/)
  })
})