// libs/domain/src/lib/factories/channels/transaction-channel.factory.spec.ts
import { describe, it, expect } from 'vitest'
import { TransactionChannelFactory, WhatsAppChannel, NotificationChannel } from './transaction-channel.factory'
import { TransactionOrigin } from '../../enums'

describe('TransactionChannelFactory', () => {
  it('deve criar o canal correto para cada origem', () => {
    const channel = TransactionChannelFactory.create(TransactionOrigin.WHATSAPP)
    expect(channel).toBeInstanceOf(WhatsAppChannel)
  })

  it('WhatsAppChannel deve extrair valores de texto', async () => {
    const channel = new WhatsAppChannel()
    const parsed = await channel.parse({ text: 'Gastei R$ 150,50 no mercado', timestamp: 1700000000 })
    expect(parsed.amount).toBe(150.50)
  })

  it('NotificationChannel deve identificar bancos suportados', async () => {
    const channel = new NotificationChannel()
    const data = { appPackage: 'com.nu.production', text: 'Compra de R$ 85,90 em iFood', timestamp: Date.now() }
    const parsed = await channel.parse(data)
    expect(parsed.amount).toBe(85.90)
    expect(parsed.description).toBe('iFood')
  })
})