import { describe, it, expect } from 'vitest';
import { quizOficial } from './quizOficial.js';
import { validarPergunta, corrigirResposta } from '../logica/perguntas.js';

const ANGULOS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const { perguntas } = quizOficial;

describe('quiz oficial', () => {
  it('tem 30 perguntas válidas e com explicação', () => {
    expect(perguntas).toHaveLength(30);
    for (const p of perguntas) {
      expect(validarPergunta(p), p.id).toEqual([]);
      expect(p.explicacao.length, p.id).toBeGreaterThan(10);
    }
  });

  it('tem ids únicos', () => {
    expect(new Set(perguntas.map((p) => p.id)).size).toBe(30);
  });

  it('mistura os três tipos', () => {
    for (const tipo of ['multipla', 'vf', 'valor']) {
      expect(perguntas.filter((p) => p.tipo === tipo).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('cobre os 16 ângulos notáveis', () => {
    const citados = new Set();
    for (const p of perguntas) {
      for (const m of p.enunciado.matchAll(/(\d+)°/g)) citados.add(Number(m[1]));
    }
    for (const a of ANGULOS) expect(citados.has(a), `${a}°`).toBe(true);
  });

  it('as respostas aceitas corrigem a si mesmas', () => {
    for (const p of perguntas.filter((q) => q.tipo === 'valor')) {
      for (const r of p.respostasAceitas) expect(corrigirResposta(p, r), p.id).toBe(true);
    }
  });

  it('valores conferem com a trigonometria (amostra)', () => {
    const rad = (g) => (g * Math.PI) / 180;
    const casos = [
      ['of04', Math.sin(rad(60))],
      ['of07', Math.cos(rad(135))],
      ['of10', Math.sin(rad(210))],
      ['of23', Math.tan(rad(60))],
      ['of26', Math.sin(rad(270))],
      ['of29', Math.cos(rad(240))],
      ['of15', rad(315)],
      ['of30', rad(300)],
    ];
    for (const [id, valor] of casos) {
      const p = perguntas.find((q) => q.id === id);
      expect(corrigirResposta(p, valor.toFixed(4)), id).toBe(true);
    }
  });
});
