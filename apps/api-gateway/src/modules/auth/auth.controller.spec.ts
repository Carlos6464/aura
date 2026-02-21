import 'reflect-metadata'
import { UnauthorizedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AuthModule } from './auth.module'
import { AuthController } from './auth.controller'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile()

    controller = module.get(AuthController)
  })

  it('deve retornar tokens com credenciais do seed', async () => {
    const result = await controller.login({
      email: 'adriano@aura.com',
      password: 'Aura@2026',
    })

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.user.email).toBe('adriano@aura.com')
    expect(result.user.plan).toBe('FREE')
  })

  it('deve retornar PREMIUM para usuário admin', async () => {
    const result = await controller.login({
      email: 'admin@aura.com',
      password: 'Admin@2026',
    })

    expect(result.user.role).toBe('ADMIN')
    expect(result.user.plan).toBe('PREMIUM')
  })

  it('deve lançar UnauthorizedException para credenciais inválidas', async () => {
    await expect(
      controller.login({ email: 'adriano@aura.com', password: 'errada' })
    ).rejects.toThrow(UnauthorizedException) // Aqui validamos a classe da exceção
  })

  it('deve renovar os tokens com refresh token válido', async () => {
    const login = await controller.login({
      email: 'adriano@aura.com',
      password: 'Aura@2026',
    })

    const result = await controller.refresh({ refreshToken: login.refreshToken })

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).not.toBe(login.refreshToken)
  })

  it('não deve aceitar o mesmo refresh token duas vezes (rotação)', async () => {
    const login = await controller.login({
      email: 'adriano@aura.com',
      password: 'Aura@2026',
    })

    // Primeira atualização (sucesso)
    await controller.refresh({ refreshToken: login.refreshToken })

    // Segunda tentativa com o mesmo token antigo (deve falhar)
    await expect(
      controller.refresh({ refreshToken: login.refreshToken })
    ).rejects.toThrow(UnauthorizedException) // Aqui também validamos a classe da exceção
  })
})