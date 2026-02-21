import bcrypt from 'bcryptjs'
import { IPasswordHasher } from '@aura/application'

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly saltRounds: number = 12) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}