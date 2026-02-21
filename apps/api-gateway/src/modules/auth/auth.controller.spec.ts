import 'reflect-metadata'
import { describe, it, expect, beforeEach } from 'vitest'
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

  // ── Login ──────────────────────────────────────────────────────────────────

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
    ).rejects.toThrow('Unauthorized')
  })

  // ── Refresh ────────────────────────────────────────────────────────────────

  it('deve renovar os tokens com refresh token válido', async () => {
    const login = await controller.login({
      email: 'adriano@aura.com',
      password: 'Aura@2026',
    })

    const result = await controller.refresh({ refreshToken: login.refreshToken })

    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    // Rotação — novo refresh token diferente do original
    expect(result.refreshToken).not.toBe(login.refreshToken)
  })

  it('deve lançar UnauthorizedException para refresh token inválido', async () => {
    await expect(
      controller.refresh({ refreshToken: 'token-invalido' })
    ).rejects.toThrow('Unauthorized')
  })

  it('não deve aceitar o mesmo refresh token duas vezes (rotação)', async () => {
    const login = await controller.login({
      email: 'adriano@aura.com',
      password: 'Aura@2026',
    })

    // Usa o refresh token uma vez
    await controller.refresh({ refreshToken: login.refreshToken })

    // Tenta usar novamente — deve falhar
    await expect(
      controller.refresh({ refreshToken: login.refreshToken })
    ).rejects.toThrow('Unauthorized')
  })
})