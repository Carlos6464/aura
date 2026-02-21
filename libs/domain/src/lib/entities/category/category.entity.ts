import { InvalidOperationError } from '../../errors/domain.errors'

export class Category {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _icon: string,
    private _color: string,
    public readonly userId: string | null,
    public readonly isSystem: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: {
    id: string
    name: string
    icon: string
    color: string
    userId?: string
  }): Category {
    const now = new Date()
    return new Category(
      props.id,
      props.name.trim(),
      props.icon,
      props.color,
      props.userId ?? null,
      !props.userId,
      now,
      now,
    )
  }

  private _guardSystem(): void {
    if (this.isSystem) {
      throw new InvalidOperationError(`Categoria do sistema "${this._name}" não pode ser alterada`)
    }
  }

  rename(name: string): void {
    this._guardSystem()
    if (name.trim().length < 2) throw new InvalidOperationError('Nome deve ter ao menos 2 caracteres')
    this._name = name.trim()
    this._updatedAt = new Date()
  }

  updateIcon(icon: string): void {
    this._guardSystem()
    this._icon = icon
    this._updatedAt = new Date()
  }

  updateColor(color: string): void {
    this._guardSystem()
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new InvalidOperationError(`Cor inválida: ${color}. Use hex #RRGGBB`)
    }
    this._color = color
    this._updatedAt = new Date()
  }

  isVisibleTo(userId: string): boolean {
    return this.isSystem || this.userId === userId
  }

  get name(): string { return this._name }
  get icon(): string { return this._icon }
  get color(): string { return this._color }
  get updatedAt(): Date { return this._updatedAt }
}

export const SYSTEM_CATEGORIES = [
  { id: 'cat-food',          name: 'Alimentação',   icon: 'utensils',     color: '#FF6B6B' },
  { id: 'cat-transport',     name: 'Transporte',    icon: 'car',          color: '#4ECDC4' },
  { id: 'cat-health',        name: 'Saúde',         icon: 'heart-pulse',  color: '#45B7D1' },
  { id: 'cat-entertainment', name: 'Lazer',         icon: 'tv',           color: '#96CEB4' },
  { id: 'cat-shopping',      name: 'Compras',       icon: 'shopping-bag', color: '#FFEAA7' },
  { id: 'cat-bills',         name: 'Contas',        icon: 'file-text',    color: '#DDA0DD' },
  { id: 'cat-education',     name: 'Educação',      icon: 'book-open',    color: '#98D8C8' },
  { id: 'cat-income',        name: 'Receita',       icon: 'trending-up',  color: '#6BCB77' },
  { id: 'cat-pending',       name: 'A classificar', icon: 'clock',        color: '#B0B0B0' },
] as const

export type SystemCategoryId = typeof SYSTEM_CATEGORIES[number]['id']