import { describe, it, expect } from 'vitest';
import {
  validarPergunta,
  validarQuiz,
  corrigirResposta,
  versaoPublica,
  novaPergunta,
  mudarTipo,
  tempoDaPergunta,
} from './perguntas.js';

const multipla = {
  id: 'p1', tipo: 'multipla', enunciado: 'sen 30°?',
  alternativas: ['1/2', '√3/2', '√2/2', '1'], correta: 0, explicacao: 'x',
};
const vf = { id: 'p2', tipo: 'vf', enunciado: 'tg 90° não existe', correta: true, explicacao: '' };
const valor = { id: 'p3', tipo: 'valor', enunciado: 'sen 60°?', respostasAceitas: ['√3/2'], explicacao: '' };

describe('validarPergunta()', () => {
  it('aceita perguntas completas', () => {
    expect(validarPergunta(multipla)).toEqual([]);
    expect(validarPergunta(vf)).toEqual([]);
    expect(validarPergunta(valor)).toEqual([]);
  });

  it('não deixa salvar sem gabarito', () => {
    expect(validarPergunta({ ...multipla, correta: null }).join()).toMatch(/gabarito/);
    expect(validarPergunta({ ...vf, correta: null }).join()).toMatch(/gabarito/);
    expect(validarPergunta({ ...valor, respostasAceitas: ['', '  '] }).join()).toMatch(/gabarito/);
  });

  it('exige enunciado e alternativas', () => {
    expect(validarPergunta({ ...multipla, enunciado: ' ' })).toContain('Escreva o enunciado.');
    expect(validarPergunta({ ...multipla, alternativas: ['a', '', 'c', 'd'] })).toContain('Preencha as 4 alternativas.');
  });

  it('valida o tempo personalizado', () => {
    expect(validarPergunta({ ...vf, tempo: 2 })).toHaveLength(1);
    expect(validarPergunta({ ...vf, tempo: 30 })).toEqual([]);
    expect(validarPergunta({ ...vf, tempo: null })).toEqual([]);
  });

  it('novas perguntas começam inválidas (sem gabarito)', () => {
    for (const t of ['multipla', 'vf', 'valor']) {
      expect(validarPergunta({ ...novaPergunta(t), enunciado: 'x' }).length).toBeGreaterThan(0);
    }
  });
});

describe('validarQuiz()', () => {
  it('exige título e perguntas', () => {
    expect(validarQuiz({ titulo: '', perguntas: [] }).valido).toBe(false);
    expect(validarQuiz({ titulo: 'Q', perguntas: [multipla] }).valido).toBe(true);
    const r = validarQuiz({ titulo: 'Q', perguntas: [multipla, { ...vf, correta: null }] });
    expect(r.valido).toBe(false);
    expect(r.perguntas[0].indice).toBe(1);
  });
});

describe('corrigirResposta()', () => {
  it('corrige múltipla escolha', () => {
    expect(corrigirResposta(multipla, 0)).toBe(true);
    expect(corrigirResposta(multipla, '0')).toBe(true);
    expect(corrigirResposta(multipla, 2)).toBe(false);
    expect(corrigirResposta(multipla, null)).toBe(false);
  });
  it('corrige verdadeiro ou falso', () => {
    expect(corrigirResposta(vf, true)).toBe(true);
    expect(corrigirResposta(vf, false)).toBe(false);
  });
  it('corrige digitar o valor', () => {
    expect(corrigirResposta(valor, '0,866')).toBe(true);
    expect(corrigirResposta(valor, 'raiz3/2')).toBe(true);
    expect(corrigirResposta(valor, '1/2')).toBe(false);
  });
});

describe('versaoPublica()', () => {
  it('nunca inclui o gabarito nem a explicação', () => {
    for (const p of [multipla, vf, valor]) {
      const pub = versaoPublica(p, 45, 1, 5);
      expect(pub).not.toHaveProperty('correta');
      expect(pub).not.toHaveProperty('respostasAceitas');
      expect(pub).not.toHaveProperty('explicacao');
      expect(pub.enunciado).toBe(p.enunciado);
    }
    expect(versaoPublica(multipla, 45, 1, 5).alternativas).toHaveLength(4);
  });
});

describe('utilidades', () => {
  it('mudarTipo preserva enunciado e id', () => {
    const m = mudarTipo(multipla, 'valor');
    expect(m.id).toBe('p1');
    expect(m.enunciado).toBe('sen 30°?');
    expect(m.respostasAceitas).toEqual(['']);
  });
  it('tempoDaPergunta usa o personalizado quando existe', () => {
    expect(tempoDaPergunta({ tempo: 20 }, 45)).toBe(20);
    expect(tempoDaPergunta({ tempo: null }, 45)).toBe(45);
  });
});
