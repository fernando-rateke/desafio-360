const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Gera um código de sala com 4 letras maiúsculas (ex.: "TRIG"). */
export function gerarCodigo(aleatorio = Math.random) {
  let codigo = '';
  for (let i = 0; i < 4; i++) {
    codigo += LETRAS[Math.floor(aleatorio() * LETRAS.length)];
  }
  return codigo;
}

/** Limpa o que o aluno digitou: só letras, maiúsculas, no máximo 4. */
export function limparCodigo(texto) {
  return String(texto || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4);
}

export const codigoValido = (codigo) => /^[A-Z]{4}$/.test(codigo);
