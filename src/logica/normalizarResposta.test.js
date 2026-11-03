import { describe, it, expect } from 'vitest';
import {
  normalizarResposta,
  avaliarExpressao,
  compararResposta,
  NAO_EXISTE,
} from './normalizarResposta.js';

describe('normalizarResposta()', () => {
  it('remove espaços e converte para minúsculas', () => {
    expect(normalizarResposta('  Raiz 3 / 2 ')).toBe('raiz(3)/2');
    expect(normalizarResposta('P I / 6')).toBe('pi/6');
  });

  it('troca vírgula por ponto', () => {
    expect(normalizarResposta('0,866')).toBe('0.866');
    expect(normalizarResposta('-0,5')).toBe('-0.5');
  });

  it('padroniza as variações de raiz', () => {
    const esperado = 'raiz(3)/2';
    expect(normalizarResposta('√3/2')).toBe(esperado);
    expect(normalizarResposta('raiz(3)/2')).toBe(esperado);
    expect(normalizarResposta('raiz3/2')).toBe(esperado);
    expect(normalizarResposta('√(3)/2')).toBe(esperado);
    expect(normalizarResposta('sqrt(3)/2')).toBe(esperado);
    expect(normalizarResposta('raiz de 3 / 2')).toBe(esperado);
    expect(normalizarResposta('RAIZ QUADRADA DE 3/2')).toBe(esperado);
  });

  it('converte π para pi', () => {
    expect(normalizarResposta('2π/3')).toBe('2pi/3');
    expect(normalizarResposta('π')).toBe('pi');
  });

  it('remove símbolos e palavras de unidade', () => {
    expect(normalizarResposta('45°')).toBe('45');
    expect(normalizarResposta('45º')).toBe('45');
    expect(normalizarResposta('45 graus')).toBe('45');
    expect(normalizarResposta('π/4 rad')).toBe('pi/4');
    expect(normalizarResposta('π/4 radianos')).toBe('pi/4');
  });

  it('padroniza sinais tipográficos e "+" inicial', () => {
    expect(normalizarResposta('−1/2')).toBe('-1/2');
    expect(normalizarResposta('–1/2')).toBe('-1/2');
    expect(normalizarResposta('+1')).toBe('1');
  });

  it('padroniza zeros e decimais sem zero à esquerda', () => {
    expect(normalizarResposta('.5')).toBe('0.5');
    expect(normalizarResposta('0.50')).toBe('0.5');
    expect(normalizarResposta('1.0')).toBe('1');
    expect(normalizarResposta('1.05')).toBe('1.05');
    expect(normalizarResposta('100')).toBe('100');
  });

  it('reconhece as formas de "não existe"', () => {
    for (const t of ['não existe', 'Nao existe', 'NÃO EXISTE', 'indefinida', 'inexistente', '∄', 'não-existe'.replace('-', ' ')]) {
      expect(normalizarResposta(t)).toBe(NAO_EXISTE);
    }
  });

  it('lida com entradas vazias', () => {
    expect(normalizarResposta('')).toBe('');
    expect(normalizarResposta('   ')).toBe('');
    expect(normalizarResposta(null)).toBe('');
    expect(normalizarResposta(undefined)).toBe('');
  });

  it('converte números para texto', () => {
    expect(normalizarResposta(0.5)).toBe('0.5');
  });
});

describe('avaliarExpressao()', () => {
  const perto = (a, b) => expect(Math.abs(a - b)).toBeLessThan(1e-9);

  it('avalia números e frações', () => {
    expect(avaliarExpressao('1')).toBe(1);
    expect(avaliarExpressao('-1/2')).toBe(-0.5);
    expect(avaliarExpressao('0.866')).toBe(0.866);
  });

  it('avalia raízes', () => {
    perto(avaliarExpressao('raiz(3)/2'), Math.sqrt(3) / 2);
    perto(avaliarExpressao('-raiz(2)/2'), -Math.sqrt(2) / 2);
    perto(avaliarExpressao('raiz(3)'), Math.sqrt(3));
  });

  it('avalia pi e multiplicação implícita', () => {
    perto(avaliarExpressao('pi/6'), Math.PI / 6);
    perto(avaliarExpressao('2pi/3'), (2 * Math.PI) / 3);
    perto(avaliarExpressao('11pi/6'), (11 * Math.PI) / 6);
    perto(avaliarExpressao('2raiz(3)'), 2 * Math.sqrt(3));
    perto(avaliarExpressao('2(1+1)'), 4);
  });

  it('respeita precedência e parênteses', () => {
    expect(avaliarExpressao('1+2*3')).toBe(7);
    expect(avaliarExpressao('(1+2)*3')).toBe(9);
    expect(avaliarExpressao('2^3')).toBe(8);
  });

  it('retorna null para textos que não são expressões', () => {
    expect(avaliarExpressao('')).toBeNull();
    expect(avaliarExpressao(NAO_EXISTE)).toBeNull();
    expect(avaliarExpressao('abc')).toBeNull();
    expect(avaliarExpressao('1/')).toBeNull();
    expect(avaliarExpressao('(1')).toBeNull();
    expect(avaliarExpressao('1/0')).toBeNull();
    expect(avaliarExpressao('1..2')).toBeNull();
    expect(avaliarExpressao('alert(1)')).toBeNull();
  });
});

describe('compararResposta()', () => {
  it('aceita √3/2, raiz(3)/2, raiz3/2 e 0.866 como equivalentes', () => {
    const variacoes = ['√3/2', 'raiz(3)/2', 'raiz3/2', '0.866', '0,866', ' √ 3 / 2 '];
    for (const digitada of variacoes) {
      for (const aceita of ['√3/2', '0.866', 'raiz3/2']) {
        expect(compararResposta(digitada, [aceita])).toBe(true);
      }
    }
  });

  it('aceita arredondamentos próximos (até 0,005)', () => {
    expect(compararResposta('0.87', ['√3/2'])).toBe(true);
    expect(compararResposta('0.71', ['√2/2'])).toBe(true);
    expect(compararResposta('0,707', ['raiz(2)/2'])).toBe(true);
    expect(compararResposta('1.73', ['√3'])).toBe(true);
  });

  it('rejeita valores distantes', () => {
    expect(compararResposta('0.8', ['√3/2'])).toBe(false);
    expect(compararResposta('0.7', ['√2/2'])).toBe(false);
    expect(compararResposta('1/2', ['√3/2'])).toBe(false);
  });

  it('diferencia o sinal', () => {
    expect(compararResposta('1/2', ['-1/2'])).toBe(false);
    expect(compararResposta('-0,5', ['-1/2'])).toBe(true);
    expect(compararResposta('−√2/2', ['-√2/2'])).toBe(true);
  });

  it('compara radianos', () => {
    expect(compararResposta('2π/3', ['2pi/3'])).toBe(true);
    expect(compararResposta('2 pi / 3', ['2π/3'])).toBe(true);
    expect(compararResposta('π/6 rad', ['π/6'])).toBe(true);
    expect(compararResposta('π/3', ['2π/3'])).toBe(false);
  });

  it('compara graus com e sem símbolo', () => {
    expect(compararResposta('45', ['45°'])).toBe(true);
    expect(compararResposta('45 graus', ['45'])).toBe(true);
    expect(compararResposta('135', ['45°'])).toBe(false);
  });

  it('compara frações e decimais', () => {
    expect(compararResposta('0.5', ['1/2'])).toBe(true);
    expect(compararResposta('.5', ['1/2'])).toBe(true);
    expect(compararResposta('-1', ['-1'])).toBe(true);
    expect(compararResposta('1', ['1.0'])).toBe(true);
  });

  it('aceita qualquer item da lista', () => {
    expect(compararResposta('√3/3', ['1/√3', '√3/3'])).toBe(true);
    expect(compararResposta('0.577', ['√3/3'])).toBe(true);
  });

  it('compara "não existe"', () => {
    expect(compararResposta('Não existe', ['não existe'])).toBe(true);
    expect(compararResposta('indefinida', ['não existe'])).toBe(true);
    expect(compararResposta('0', ['não existe'])).toBe(false);
  });

  it('rejeita respostas vazias ou lista inválida', () => {
    expect(compararResposta('', ['0'])).toBe(false);
    expect(compararResposta('   ', ['0'])).toBe(false);
    expect(compararResposta('0', [])).toBe(false);
    expect(compararResposta('0', null)).toBe(false);
    expect(compararResposta('0', [''])).toBe(false);
  });

  it('compara textos que não são números', () => {
    expect(compararResposta('Segundo Quadrante', ['segundo quadrante'])).toBe(true);
    expect(compararResposta('terceiro', ['segundo'])).toBe(false);
  });
});
