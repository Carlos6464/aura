import { IPasswordHasher } from '@aura/application'

// Sem bcrypt — compara texto puro.
// Substitua por BcryptPasswordHasher quando ligar o banco.
export class FakePasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    return plain
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return plain === hash
  }
}