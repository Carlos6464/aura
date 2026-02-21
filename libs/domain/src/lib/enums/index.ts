// ─── Usuário ──────────────────────────────────────────────
export enum UserRole {
  ADMIN = 'ADMIN',
  USER  = 'USER',
}

// ─── Plano ────────────────────────────────────────────────
export enum PlanType {
  FREE    = 'FREE',
  PREMIUM = 'PREMIUM',
}

// ─── Transação ────────────────────────────────────────────
export enum TransactionType {
  INCOME  = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionOrigin {
  MANUAL       = 'MANUAL',
  WHATSAPP     = 'WHATSAPP',
  EMAIL        = 'EMAIL',
  OFX          = 'OFX',
  NOTIFICATION = 'NOTIFICATION',
}

// ─── IA / Comportamento ───────────────────────────────────
export enum Sentiment {
  IMPULSE   = 'IMPULSE',
  NECESSARY = 'NECESSARY',
  NEUTRAL   = 'NEUTRAL',
}

export enum EmotionalTrigger {
  BOREDOM  = 'BOREDOM',
  STRESS   = 'STRESS',
  EUPHORIA = 'EUPHORIA',
  SOCIAL   = 'SOCIAL',
}

export enum ConsciousnessStage {
  UNAWARE    = 'UNAWARE',
  AWARE      = 'AWARE',
  CHANGING   = 'CHANGING',
  AUTONOMOUS = 'AUTONOMOUS',
}

// ─── Conselhos ────────────────────────────────────────────
export enum InterventionType {
  PREVENTIVE   = 'PREVENTIVE',
  EDUCATIONAL  = 'EDUCATIONAL',
  CELEBRATORY  = 'CELEBRATORY',
  REFLECTIVE   = 'REFLECTIVE',
}

export enum AdviceChannel {
  WHATSAPP = 'WHATSAPP',
  PUSH     = 'PUSH',
  IN_APP   = 'IN_APP',
}

export enum AdviceOutcome {
  PENDING  = 'PENDING',
  IGNORED  = 'IGNORED',
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
}