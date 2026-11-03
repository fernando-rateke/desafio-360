import { describe, it, expect } from 'vitest';
import { calcularPontos, calcularTempoRestante } from './pontuacao.js';

describe('calcularPontos()', () => {
  it('dá 1000 pontos para acerto instantâneo', () => {
    expect(calcularPontos({ acertou: true, tempoRestante: 45, tempoTotal: 45 })).toBe(1000);
  });
  it('dá 500 pontos para acerto no último instante', () => {
    expect(calcularPontos({ acertou: true, tempoRestante: 0, tempoTotal: 45 })).toBe(500);
  });
  it('arredonda para inteiro', () => {
    expect(calcularPontos({ acertou: true, tempoRestante: 30, tempoTotal: 45 })).toBe(833);
    expect(calcularPontos({ acertou: true, tempoRestante: 22.5, tempoTotal: 45 })).toBe(750);
  });
  it('dá 0 para erro', () => {
    expect(calcularPontos({ acertou: false, tempoRestante: 40, tempoTotal: 45 })).toBe(0);
  });
  it('limita valores fora do intervalo', () => {
    expect(calcularPontos({ acertou: true, tempoRestante: 99, tempoTotal: 45 })).toBe(1000);
    expect(calcularPontos({ acertou: true, tempoRestante: -3, tempoTotal: 45 })).toBe(500);
    expect(calcularPontos({ acertou: true, tempoRestante: 10, tempoTotal: 0 })).toBe(0);
  });
});

describe('calcularTempoRestante()', () => {
  it('calcula a partir dos horários', () => {
    expect(calcularTempoRestante(1000, 11000, 45)).toBe(35);
  });
  it('nunca fica negativo nem passa do total', () => {
    expect(calcularTempoRestante(0, 60000, 45)).toBe(0);
    expect(calcularTempoRestante(5000, 1000, 45)).toBe(45);
  });
});
