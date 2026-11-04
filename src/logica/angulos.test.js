import { describe, it, expect } from 'vitest';
import {
  ANGULOS_NOTAVEIS,
  quadranteDe,
  normalizarGraus,
  anguloNotavelMaisProximo,
  dadosDoAngulo,
  diferencaAngular,
  SINAIS_QUADRANTE,
} from './angulos.js';
import { avaliarExpressao, normalizarResposta } from './normalizarResposta.js';

const rad = (g) => (g * Math.PI) / 180;
const valor = (txt) => avaliarExpressao(normalizarResposta(txt.replace(/−/g, '-')));

describe('tabela de ângulos notáveis', () => {
  it('tem os 16 ângulos', () => {
    expect(ANGULOS_NOTAVEIS.map((a) => a.graus)).toEqual([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
  });

  it('seno, cosseno, tangente e radianos conferem com Math', () => {
    for (const a of ANGULOS_NOTAVEIS) {
      expect(valor(a.sen), `sen ${a.graus}`).toBeCloseTo(Math.sin(rad(a.graus)), 6);
      expect(valor(a.cos), `cos ${a.graus}`).toBeCloseTo(Math.cos(rad(a.graus)), 6);
      expect(valor(a.radianos), `rad ${a.graus}`).toBeCloseTo(rad(a.graus), 6);
      if (a.graus % 180 === 90) expect(a.tg).toBe('∄');
      else expect(valor(a.tg), `tg ${a.graus}`).toBeCloseTo(Math.tan(rad(a.graus)), 6);
    }
  });

  it('sinais batem com a tabela de quadrantes', () => {
    for (const a of ANGULOS_NOTAVEIS.filter((x) => x.quadrante > 0)) {
      const s = SINAIS_QUADRANTE[a.quadrante];
      expect(a.sen.startsWith('−') ? '−' : '+').toBe(s.sen);
      expect(a.cos.startsWith('−') ? '−' : '+').toBe(s.cos);
      expect(a.tg.startsWith('−') ? '−' : '+').toBe(s.tg);
    }
  });
});

describe('utilidades', () => {
  it('quadranteDe', () => {
    expect(quadranteDe(0)).toBe(0);
    expect(quadranteDe(30)).toBe(1);
    expect(quadranteDe(150)).toBe(2);
    expect(quadranteDe(225)).toBe(3);
    expect(quadranteDe(330)).toBe(4);
    expect(quadranteDe(270)).toBe(0);
    expect(quadranteDe(-30)).toBe(4);
  });
  it('normalizarGraus', () => {
    expect(normalizarGraus(370)).toBe(10);
    expect(normalizarGraus(-90)).toBe(270);
  });
  it('anguloNotavelMaisProximo', () => {
    expect(anguloNotavelMaisProximo(52).graus).toBe(45);
    expect(anguloNotavelMaisProximo(53).graus).toBe(60);
    expect(anguloNotavelMaisProximo(356).graus).toBe(0);
    expect(anguloNotavelMaisProximo(-20).graus).toBe(330);
  });
  it('dadosDoAngulo', () => {
    expect(dadosDoAngulo(150).radianos).toBe('5π/6');
    expect(dadosDoAngulo(510).graus).toBe(150);
    expect(dadosDoAngulo(10)).toBeNull();
  });
  it('diferencaAngular pega o caminho mais curto', () => {
    expect(diferencaAngular(350, 10)).toBe(20);
    expect(diferencaAngular(10, 350)).toBe(-20);
    expect(diferencaAngular(0, 180)).toBe(-180);
  });
});
