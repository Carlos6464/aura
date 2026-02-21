import { Email } from '../../value-objects/email.vo'
import { Plan } from '../plan/plan.entity'
import { UserRole } from '../../enums'
import { InvalidOperationError } from '../../errors/domain.errors'

export class User {
  private constructor(
    public readonly id: string,
    private _email: Email,
    private _passwordHash: string | null,
    private _whatsapp: string | null,
    private _avatarUrl: string | null,
    private _monitoredApps: string[],
    private _plan: Plan,
    public readonly role: UserRole,
    public readonly googleId: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string
    email: string
    plan: Plan
    role?: UserRole
    passwordHash?: string
    whatsapp?: string
    avatarUrl?: string
    googleId?: string
    monitoredApps?: string[]
  }): User {
    const role = props.role ?? UserRole.USER
    // Admin sempre recebe Premium — independente do plano passado
    const plan = role === UserRole.ADMIN ? Plan.PREMIUM() : props.plan

    return new User(
      props.id,
      Email.of(props.email),
      props.passwordHash ?? null,
      props.whatsapp ?? null,
      props.avatarUrl ?? null,
      props.monitoredApps ?? [],
      plan,
      role,
      props.googleId ?? null,
      new Date(),
    )
  }

  addMonitoredApp(appPackage: string): void {
    if (!this.isAdmin()) {
      const limit = this._plan.limits.bankAppsLimit
      if (limit !== -1 && this._monitoredApps.length >= limit) {
        throw new InvalidOperationError(
          `Plano ${this._plan.name} permite apenas ${limit} app(s). Faça upgrade para Premium.`
        )
      }
    }
    if (!this._monitoredApps.includes(appPackage)) {
      this._monitoredApps = [...this._monitoredApps, appPackage]
    }
  }

  removeMonitoredApp(app: string): void {
    this._monitoredApps = this._monitoredApps.filter(a => a !== app)
  }

  upgradePlan(plan: Plan): void {
    if (this.isAdmin()) throw new InvalidOperationError('Admin já possui acesso total')
    this._plan = plan
  }

  downgradePlan(plan: Plan): void {
    if (this.isAdmin()) throw new InvalidOperationError('Admin não pode ter o plano rebaixado')
    this._plan = plan
  }

  connectWhatsapp(number: string): void {
    const cleaned = number.replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 13) {
      throw new InvalidOperationError(`Número inválido: ${number}`)
    }
    this._whatsapp = cleaned
  }

  isAdmin(): boolean { return this.role === UserRole.ADMIN }
  isSubjectToPlanLimits(): boolean { return !this.isAdmin() }
  canAccessAdminPanel(): boolean { return this.isAdmin() }

  get email(): Email { return this._email }
  get passwordHash(): string | null { return this._passwordHash }
  get hasPassword(): boolean { return this._passwordHash !== null }
  get whatsapp(): string | null { return this._whatsapp }
  get avatarUrl(): string | null { return this._avatarUrl }
  get monitoredApps(): string[] { return [...this._monitoredApps] }
  get plan(): Plan { return this._plan }
  get hasWhatsapp(): boolean { return this._whatsapp !== null }
}