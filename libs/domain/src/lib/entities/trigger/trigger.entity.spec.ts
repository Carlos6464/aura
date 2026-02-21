// lib/entities/trigger/trigger.entity.spec.ts
import { describe, it, expect } from 'vitest'
import { Trigger } from './trigger.entity'
import { EmotionalTrigger } from '../../enums'

describe('Trigger Entity', () => {
  it('deve aumentar a frequência ao ser reforçado', () => {
    const trigger = Trigger.create({
      id: 'tr-1',
      userId: 'u1',
      type: EmotionalTrigger.SOCIAL,
      description: 'Pressão de amigos',
      context: ['bar', 'fim de semana']
    })

    trigger.reinforce()
    expect(trigger.frequency).toBe(2)
  })

  it('deve se tornar dominante após 7 detecções', () => {
    const trigger = Trigger.create({
      id: 'tr-1', userId: 'u1', type: EmotionalTrigger.STRESS,
      description: 'Trabalho', context: []
    })

    for (let i = 0; i < 6; i++) trigger.reinforce()
    
    expect(trigger.isDominant()).toBe(true)
  })
})