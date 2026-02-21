// lib/entities/psychological-profile/psychological-profile.entity.spec.ts
import { describe, it, expect } from 'vitest'
import { PsychologicalProfile } from './psychological-profile.entity'
import { ConsciousnessStage } from '../../enums'

describe('PsychologicalProfile Entity', () => {
  it('deve evoluir para o estágio AWARE após 3 conselhos enviados', () => {
    const profile = PsychologicalProfile.create({ id: 'prof-1', userId: 'u1' })
    
    profile.recordAdviceSent()
    profile.recordAdviceSent()
    profile.recordAdviceSent()
    
    expect(profile.consciousnessStage).toBe(ConsciousnessStage.AWARE)
  })

  it('deve calcular o impulse score usando média móvel exponencial', () => {
    const profile = PsychologicalProfile.create({ id: 'prof-1', userId: 'u1' })
    
    // Primeira transação impulsiva (Alpha 0.1)
    profile.updateImpulseScore(true)
    // Score esperado: 0.1 * 1 + 0.9 * 0 = 0.1
    expect(profile.impulseScore).toBeCloseTo(0.1)

    // Segunda transação impulsiva
    profile.updateImpulseScore(true)
    // Score esperado: 0.1 * 1 + 0.9 * 0.1 = 0.19
    expect(profile.impulseScore).toBeCloseTo(0.19)
  })

  it('deve atingir o estágio AUTONOMOUS com score baixo e taxa de sucesso alta', () => {
    const profile = PsychologicalProfile.create({ id: 'prof-1', userId: 'u1' })
    
    // Simula 10 conselhos onde 8 foram positivos (80% sucesso)
    for (let i = 0; i < 10; i++) {
      profile.recordAdviceSent()
      if (i < 8) profile.recordPositiveOutcome()
    }
    
    // Impulse score baixo (padrão é 0)
    expect(profile.consciousnessStage).toBe(ConsciousnessStage.AUTONOMOUS)
  })
})