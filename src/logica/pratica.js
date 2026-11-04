/**
 * Mini-jogo do tutorial: "encontre o ângulo na roleta e leia o valor".
 */
import { ANGULOS_NOTAVEIS } from './angulos.js';
import { embaralhar } from './sorteio.js';

export const FUNCOES = {
  sen: 'o seno',
  cos: 'o cosseno',
  tg: 'a tangente',
  radianos: 'o valor em radianos',
};

/**
 * Gera `quantidade` desafios com ângulos diferentes.
 * @returns {{ graus: number, funcao: string, correta: string, opcoes: string[] }[]}
 */
export function gerarDesafios(quantidade = 5, aleatorio = Math.random) {
  const angulos = embaralhar(ANGULOS_NOTAVEIS.filter((a) => a.graus !== 0), aleatorio).slice(0, quantidade);
  const funcoes = Object.keys(FUNCOES);
  return angulos.map((a, i) => {
    const funcao = funcoes[(i + Math.floor(aleatorio() * funcoes.length)) % funcoes.length];
    return { graus: a.graus, funcao, correta: a[funcao], opcoes: gerarOpcoes(a[funcao], funcao, aleatorio) };
  });
}

/** 4 alternativas distintas (uma correta), tiradas dos valores reais da tabela. */
export function gerarOpcoes(correta, funcao, aleatorio = Math.random) {
  const valores = [...new Set(ANGULOS_NOTAVEIS.map((a) => a[funcao]))].filter((v) => v !== correta);
  const erradas = embaralhar(valores, aleatorio).slice(0, 3);
  return embaralhar([correta, ...erradas], aleatorio);
}
