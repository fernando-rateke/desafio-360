import { describe, it, expect } from 'vitest';
import { sortearPerguntas, embaralhar } from './sorteio.js';
import { gerarCodigo, limparCodigo, codigoValido } from './gerarCodigo.js';

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

describe('sortearPerguntas()', () => {
  it('sorteia a quantidade pedida sem repetir', () => {
    const r = sortearPerguntas(ids, {}, 5);
    expect(r.sorteadas).toHaveLength(5);
    expect(new Set(r.sorteadas).size).toBe(5);
    expect(r.esgotado).toBe(false);
  });

  it('nunca devolve perguntas já usadas', () => {
    const usadas = { a: true, b: true, c: true };
    for (let i = 0; i < 50; i++) {
      const r = sortearPerguntas(ids, usadas, 4);
      expect(r.sorteadas.some((id) => usadas[id])).toBe(false);
    }
  });

  it('aceita a lista de usadas como vetor', () => {
    const r = sortearPerguntas(ids, ['a', 'b'], 5);
    expect(r.sorteadas.sort()).toEqual(['c', 'd', 'e', 'f', 'g']);
  });

  it('avisa quando o banco não tem perguntas suficientes', () => {
    const r = sortearPerguntas(ids, { a: true, b: true, c: true, d: true }, 5);
    expect(r.esgotado).toBe(true);
    expect(r.disponiveis).toBe(3);
    expect(r.sorteadas).toHaveLength(3);
  });

  it('dois grupos seguidos não compartilham perguntas', () => {
    const usadas = {};
    const g1 = sortearPerguntas(ids, usadas, 3).sorteadas;
    g1.forEach((id) => (usadas[id] = true));
    const g2 = sortearPerguntas(ids, usadas, 3).sorteadas;
    expect(g1.filter((id) => g2.includes(id))).toEqual([]);
  });
});

describe('embaralhar()', () => {
  it('mantém os mesmos elementos e não altera o original', () => {
    const original = [1, 2, 3, 4];
    const e = embaralhar(original);
    expect(e.sort()).toEqual([1, 2, 3, 4]);
    expect(original).toEqual([1, 2, 3, 4]);
  });
});

describe('código da sala', () => {
  it('gera 4 letras maiúsculas', () => {
    for (let i = 0; i < 100; i++) expect(codigoValido(gerarCodigo())).toBe(true);
  });
  it('limpa o que o aluno digita', () => {
    expect(limparCodigo(' tr-ig9x ')).toBe('TRIG');
    expect(codigoValido('TRI')).toBe(false);
  });
});
