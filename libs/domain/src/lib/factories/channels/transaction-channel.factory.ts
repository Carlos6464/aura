import { TransactionOrigin, TransactionType } from '../../enums'

// ── Contrato comum ────────────────────────────────────────────────────────────
export interface ParsedTransactionData {
  amount: number
  type: TransactionType
  description: string
  date: Date
  categoryId: string
  metadata?: Record<string, unknown>
}

export interface TransactionChannel {
  readonly origin: TransactionOrigin
  parse(rawData: unknown): Promise<ParsedTransactionData>
}

// ── 1. Manual (App Mobile) ────────────────────────────────────────────────────
export class ManualChannel implements TransactionChannel {
  readonly origin = TransactionOrigin.MANUAL

  async parse(rawData: unknown): Promise<ParsedTransactionData> {
    const d = rawData as { amount: number; type: string; description: string; date: string; categoryId: string }
    return { amount: d.amount, type: d.type as TransactionType, description: d.description.trim(), date: new Date(d.date), categoryId: d.categoryId }
  }
}

// ── 2. WhatsApp (Evolution API) ───────────────────────────────────────────────
export class WhatsAppChannel implements TransactionChannel {
  readonly origin = TransactionOrigin.WHATSAPP

  async parse(rawData: unknown): Promise<ParsedTransactionData> {
    const d = rawData as { text: string; timestamp: number }
    const match = d.text.match(/R?\$?\s*(\d+(?:[.,]\d{2})?)/)
    const amount = match ? parseFloat(match[1].replace(',', '.')) : 0
    return { amount, type: TransactionType.EXPENSE, description: d.text, date: new Date(d.timestamp * 1000), categoryId: 'cat-pending' }
  }
}

// ── 3. Notificação Android ────────────────────────────────────────────────────
export class NotificationChannel implements TransactionChannel {
  readonly origin = TransactionOrigin.NOTIFICATION

  private static readonly PATTERNS: Record<string, RegExp> = {
    'com.nu.production':           /Compra.*?R\$\s*([\d,.]+).*?em\s+(.+)/i,
    'com.itau.android':            /Compra.*?R\$\s*([\d,.]+)/i,
    'br.com.bradesco':             /Compra\s+R\$\s*([\d,.]+)/i,
    'com.bancointer.interdigital': /R\$\s*([\d,.]+)/i,
  }

  async parse(rawData: unknown): Promise<ParsedTransactionData> {
    const d = rawData as { appPackage: string; text: string; timestamp: number }
    const pattern = NotificationChannel.PATTERNS[d.appPackage]
    const match = pattern ? d.text.match(pattern) : null
    const amount = match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : 0
    const description = match?.[2]?.trim() ?? d.text.substring(0, 50)
    return { amount, type: TransactionType.EXPENSE, description, date: new Date(d.timestamp), categoryId: 'cat-pending', metadata: { appPackage: d.appPackage } }
  }
}

// ── 4. Email (SendGrid inbound) ───────────────────────────────────────────────
export class EmailChannel implements TransactionChannel {
  readonly origin = TransactionOrigin.EMAIL

  async parse(rawData: unknown): Promise<ParsedTransactionData> {
    const d = rawData as { subject: string; body: string; receivedAt: string }
    return { amount: 0, type: TransactionType.EXPENSE, description: d.subject, date: new Date(d.receivedAt), categoryId: 'cat-pending', metadata: { emailBody: d.body.substring(0, 500) } }
  }
}

// ── 5. OFX (Extrato bancário) ─────────────────────────────────────────────────
export class OFXChannel implements TransactionChannel {
  readonly origin = TransactionOrigin.OFX

  async parse(rawData: unknown): Promise<ParsedTransactionData> {
    const d = rawData as { TRNAMT: string; MEMO: string; DTPOSTED: string; FITID: string }
    const raw = parseFloat(d.TRNAMT)
    const s = d.DTPOSTED
    const date = new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(8,10)}:${s.slice(10,12)}:${s.slice(12,14)}`)
    return { amount: Math.abs(raw), type: raw < 0 ? TransactionType.EXPENSE : TransactionType.INCOME, description: d.MEMO.trim(), date, categoryId: 'cat-pending', metadata: { fitId: d.FITID } }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
export class TransactionChannelFactory {
  private static readonly channels = new Map<TransactionOrigin, TransactionChannel>([
    [TransactionOrigin.MANUAL,       new ManualChannel()],
    [TransactionOrigin.WHATSAPP,     new WhatsAppChannel()],
    [TransactionOrigin.NOTIFICATION, new NotificationChannel()],
    [TransactionOrigin.EMAIL,        new EmailChannel()],
    [TransactionOrigin.OFX,          new OFXChannel()],
  ])

  static create(origin: TransactionOrigin): TransactionChannel {
    const channel = this.channels.get(origin)
    if (!channel) throw new Error(`Canal não suportado: ${origin}`)
    return channel
  }

  static supports(origin: TransactionOrigin): boolean {
    return this.channels.has(origin)
  }
}