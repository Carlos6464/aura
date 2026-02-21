import { describe, it, expect } from 'vitest';
import { Category } from './category.entity';

describe('Category Entity', () => {
  it('deve impedir a alteração de uma categoria de sistema', () => {
    const systemCat = Category.create({
      id: 'cat-food',
      name: 'Alimentação',
      icon: 'utensils',
      color: '#FF6B6B'
    });

    expect(systemCat.isSystem).toBe(true);
    expect(() => systemCat.rename('Lanches')).toThrow('Categoria do sistema "Alimentação" não pode ser alterada');
  });

  it('deve validar o formato da cor hexadecimal', () => {
    const userCat = Category.create({
      id: '1',
      name: 'Viagem',
      icon: 'plane',
      color: '#FFFFFF',
      userId: 'user-123'
    });

    expect(() => userCat.updateColor('invalid-color')).toThrow('Cor inválida');
  });
});