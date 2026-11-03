/**
 * Sorteio de perguntas sem repetição entre os grupos.
 */

/** Embaralha uma cópia do vetor (Fisher–Yates). */
export function embaralhar(lista, aleatorio = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Sorteia `quantidade` ids que ainda não foram usados na sala.
 * Nunca repete: se não houver perguntas suficientes, `esgotado` vem true e
 * `sorteadas` traz apenas as que restam (o professor decide o que fazer).
 *
 * @param {string[]} todosIds ids de todas as perguntas do quiz
 * @param {Record<string, boolean>|string[]} usadas ids já sorteados nesta sala
 * @param {number} quantidade perguntas por grupo
 * @returns {{ sorteadas: string[], disponiveis: number, esgotado: boolean }}
 */
export function sortearPerguntas(todosIds, usadas, quantidade, aleatorio = Math.random) {
  const jaUsadas = new Set(Array.isArray(usadas) ? usadas : Object.keys(usadas || {}));
  const restantes = todosIds.filter((id) => !jaUsadas.has(id));
  const sorteadas = embaralhar(restantes, aleatorio).slice(0, quantidade);
  return {
    sorteadas,
    disponiveis: restantes.length,
    esgotado: restantes.length < quantidade,
  };
}
