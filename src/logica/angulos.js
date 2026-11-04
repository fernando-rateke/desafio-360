/**
 * Os 16 ângulos notáveis do círculo trigonométrico com os valores que a
 * roleta física mostra na janela: graus, radianos, seno, cosseno e tangente.
 */

/** @typedef {{ graus: number, radianos: string, sen: string, cos: string, tg: string, quadrante: number }} Angulo */

const R2 = '√2/2';
const R3 = '√3/2';
const T3 = '√3/3';

/** @type {Angulo[]} */
export const ANGULOS_NOTAVEIS = [
  { graus: 0, radianos: '0', sen: '0', cos: '1', tg: '0' },
  { graus: 30, radianos: 'π/6', sen: '1/2', cos: R3, tg: T3 },
  { graus: 45, radianos: 'π/4', sen: R2, cos: R2, tg: '1' },
  { graus: 60, radianos: 'π/3', sen: R3, cos: '1/2', tg: '√3' },
  { graus: 90, radianos: 'π/2', sen: '1', cos: '0', tg: '∄' },
  { graus: 120, radianos: '2π/3', sen: R3, cos: '−1/2', tg: '−√3' },
  { graus: 135, radianos: '3π/4', sen: R2, cos: '−' + R2, tg: '−1' },
  { graus: 150, radianos: '5π/6', sen: '1/2', cos: '−' + R3, tg: '−' + T3 },
  { graus: 180, radianos: 'π', sen: '0', cos: '−1', tg: '0' },
  { graus: 210, radianos: '7π/6', sen: '−1/2', cos: '−' + R3, tg: T3 },
  { graus: 225, radianos: '5π/4', sen: '−' + R2, cos: '−' + R2, tg: '1' },
  { graus: 240, radianos: '4π/3', sen: '−' + R3, cos: '−1/2', tg: '√3' },
  { graus: 270, radianos: '3π/2', sen: '−1', cos: '0', tg: '∄' },
  { graus: 300, radianos: '5π/3', sen: '−' + R3, cos: '1/2', tg: '−√3' },
  { graus: 315, radianos: '7π/4', sen: '−' + R2, cos: R2, tg: '−1' },
  { graus: 330, radianos: '11π/6', sen: '−1/2', cos: R3, tg: '−' + T3 },
].map((a) => ({ ...a, quadrante: quadranteDe(a.graus) }));

/**
 * Quadrante de um ângulo: 1 a 4, ou 0 quando está sobre um eixo (0°, 90°, 180°, 270°).
 */
export function quadranteDe(graus) {
  const g = normalizarGraus(graus);
  if (g % 90 === 0) return 0;
  return Math.floor(g / 90) + 1;
}

/** Leva qualquer ângulo para o intervalo [0, 360). */
export function normalizarGraus(graus) {
  return ((graus % 360) + 360) % 360;
}

/** Ângulo notável mais próximo (considerando a volta: 355° → 0°). */
export function anguloNotavelMaisProximo(graus) {
  const g = normalizarGraus(graus);
  let melhor = ANGULOS_NOTAVEIS[0];
  let menor = Infinity;
  for (const a of ANGULOS_NOTAVEIS) {
    const d = Math.min(Math.abs(g - a.graus), 360 - Math.abs(g - a.graus));
    if (d < menor) {
      menor = d;
      melhor = a;
    }
  }
  return melhor;
}

/** Dados de um ângulo notável exato (ou null). */
export function dadosDoAngulo(graus) {
  const g = normalizarGraus(Math.round(graus));
  return ANGULOS_NOTAVEIS.find((a) => a.graus === g) || null;
}

/** Diferença assinada mais curta entre dois ângulos (em graus, entre −180 e 180). */
export function diferencaAngular(de, para) {
  return ((((para - de) % 360) + 540) % 360) - 180;
}

export const NOMES_QUADRANTES = ['sobre um eixo', '1º quadrante', '2º quadrante', '3º quadrante', '4º quadrante'];

/** Sinais (sen, cos, tg) em cada quadrante. */
export const SINAIS_QUADRANTE = {
  1: { sen: '+', cos: '+', tg: '+' },
  2: { sen: '+', cos: '−', tg: '−' },
  3: { sen: '−', cos: '−', tg: '+' },
  4: { sen: '−', cos: '+', tg: '−' },
};
