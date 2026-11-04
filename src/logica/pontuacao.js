/**
 * Regras de pontuação do Desafio 360 (inspiradas no Kahoot).
 * Acerto: 500 + 500 × (tempo restante ÷ tempo total), arredondado.
 * Erro ou tempo esgotado: 0.
 */

export const PONTOS_BASE = 500;
export const PONTOS_BONUS_MAXIMO = 500;

/** Contagem "3, 2, 1, valendo!" antes de cada pergunta (o tempo só corre depois dela). */
export const CONTAGEM_MS = 3000;

/** Horário (ms) em que a pergunta realmente começa: publicação + contagem. */
export function inicioEfetivo(perguntaAtiva) {
  if (perguntaAtiva?.inicioEm == null) return null;
  return perguntaAtiva.inicioEm + (Number(perguntaAtiva.contagemMs) || 0);
}

/** Limita um número ao intervalo [min, max]. */
const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * @param {{ acertou: boolean, tempoRestante: number, tempoTotal: number }} dados
 *   tempos em segundos
 * @returns {number} pontos inteiros
 */
export function calcularPontos({ acertou, tempoRestante, tempoTotal }) {
  if (!acertou || !(tempoTotal > 0)) return 0;
  const fracao = limitar(tempoRestante / tempoTotal, 0, 1);
  return Math.round(PONTOS_BASE + PONTOS_BONUS_MAXIMO * fracao);
}

/**
 * Tempo restante (em segundos, com decimais) no momento da resposta.
 * @param {number} inicioEm horário (ms) em que a pergunta começou
 * @param {number} respondidoEm horário (ms) da resposta
 * @param {number} tempoTotal duração da pergunta em segundos
 */
export function calcularTempoRestante(inicioEm, respondidoEm, tempoTotal) {
  const decorrido = (respondidoEm - inicioEm) / 1000;
  return limitar(tempoTotal - decorrido, 0, tempoTotal);
}
