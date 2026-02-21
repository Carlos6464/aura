import { describe, it, expect } from 'vitest'
import { BcryptPasswordHasher } from './bcrypt-password-hasher'

describe('BcryptPasswordHasher', () => {
  // Usamos um salt menor (4) apenas para o teste rodar mais rápido
  const hasher = new BcryptPasswordHasher(4) 

  it('deve gerar um hash diferente da senha em texto plano', async () => {
    const plain = 'MinhaSenhaSegura123'
    const hash = await hasher.hash(plain)

    expect(hash).not.toBe(plain)
    expect(hash).toBeDefined()
  })

  it('deve validar corretamente uma senha com o hash correspondente', async () => {
    const plain = 'MinhaSenhaSegura123'
    const hash = await hasher.hash(plain)

    const isValid = await hasher.compare(plain, hash)
    expect(isValid).toBe(true)
  })

  it('deve retornar falso se a senha estiver incorreta', async () => {
    const hash = await hasher.hash('SenhaCorreta')
    
    const isValid = await hasher.compare('SenhaIncorreta', hash)
    expect(isValid).toBe(false)
  })
})