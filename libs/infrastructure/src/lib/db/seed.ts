import { db } from './connection'
import { users } from '../schema/users.schema'
import { BcryptPasswordHasher } from '../auth/bcrypt-password-hasher'

async function runSeed() {
  console.log('🌱 Iniciando Seed do Banco de Dados...')
  
  const hasher = new BcryptPasswordHasher()
  const passwordHash = await hasher.hash('Aura@2026') // Senha inicial

  await db.insert(users).values({
    email: 'admin@aura.com',
    passwordHash: passwordHash,
    role: 'ADMIN',
    planId: 'PREMIUM',
  }).onConflictDoNothing() // Se já existir, ignora

  console.log('✅ Usuário admin@aura.com criado com sucesso!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Erro ao rodar o seed:', err)
  process.exit(1)
})