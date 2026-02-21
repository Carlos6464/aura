import { Transaction } from '../entities/transaction/transaction.entity'

// ── Contrato do Observer ──────────────────────────────────────────────────────
export interface TransactionObserver {
  readonly name: string
  onTransactionRegistered(transaction: Transaction): Promise<void>
}

// ── Event Bus (Observable) ────────────────────────────────────────────────────
// Publica para todos os observers em paralelo.
// Falha de um não para os outros — Promise.allSettled garante isso.
export class TransactionEventBus {
  private readonly _observers: TransactionObserver[] = []

  subscribe(observer: TransactionObserver): void {
    if (!this._observers.find(o => o.name === observer.name)) {
      this._observers.push(observer)
    }
  }

  unsubscribe(name: string): void {
    const idx = this._observers.findIndex(o => o.name === name)
    if (idx !== -1) this._observers.splice(idx, 1)
  }

  async publish(transaction: Transaction): Promise<void> {
    const results = await Promise.allSettled(
      this._observers.map(o => o.onTransactionRegistered(transaction))
    )
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[TransactionEventBus] Observer "${this._observers[i].name}" falhou:`, r.reason)
      }
    })
  }

  get observerCount(): number { return this._observers.length }
}

// ── Observers concretos ───────────────────────────────────────────────────────
// O domínio define a interface, a implementação real fica em libs/infrastructure.
// Aqui só definimos o contrato de o que cada observer recebe via injeção.

export class SentimentAnalysisObserver implements TransactionObserver {
  readonly name = 'SentimentAnalysisObserver'
  constructor(
    private readonly queue: { enqueue(name: string, data: unknown): Promise<void> }
  ) {}

  async onTransactionRegistered(tx: Transaction): Promise<void> {
    await this.queue.enqueue('ia.processing', {
      transactionId: tx.id,
      userId: tx.userId,
      description: tx.description,
      amount: tx.amount.amount,
      date: tx.date,
      origin: tx.origin,
    })
  }
}

export class PatternDetectorObserver implements TransactionObserver {
  readonly name = 'PatternDetectorObserver'
  constructor(
    private readonly patternService: { detectPatterns(tx: Transaction): Promise<void> }
  ) {}

  async onTransactionRegistered(tx: Transaction): Promise<void> {
    await this.patternService.detectPatterns(tx)
  }
}

export class AdvicePlannerObserver implements TransactionObserver {
  readonly name = 'AdvicePlannerObserver'
  constructor(
    private readonly adviceService: { planAdvice(tx: Transaction): Promise<void> }
  ) {}

  async onTransactionRegistered(tx: Transaction): Promise<void> {
    // Só planeja conselho se a IA já analisou a transação
    if (!tx.wasAnalyzed()) return
    await this.adviceService.planAdvice(tx)
  }
}