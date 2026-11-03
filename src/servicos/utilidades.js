/** Converte o que o Realtime Database devolve (objeto com chaves 0,1,2… ou array) em array. */
export function emArray(valor) {
  if (Array.isArray(valor)) return valor.filter((v) => v !== null && v !== undefined);
  if (valor && typeof valor === 'object') {
    return Object.keys(valor)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => valor[k])
      .filter((v) => v !== null && v !== undefined);
  }
  return [];
}

/** Remove `undefined` (o Firebase não aceita) e copia o objeto. */
export function limparParaBanco(objeto) {
  return JSON.parse(JSON.stringify(objeto, (_k, v) => (v === undefined ? null : v)));
}

/** Reconstrói uma pergunta lida do banco garantindo os campos esperados. */
export function normalizarPerguntaDoBanco(p) {
  const base = {
    id: p.id,
    tipo: p.tipo,
    enunciado: p.enunciado || '',
    explicacao: p.explicacao || '',
    tempo: p.tempo ?? null,
  };
  if (p.tipo === 'multipla') {
    const alternativas = emArray(p.alternativas);
    while (alternativas.length < 4) alternativas.push('');
    return { ...base, alternativas: alternativas.slice(0, 4), correta: p.correta ?? null };
  }
  if (p.tipo === 'vf') return { ...base, correta: typeof p.correta === 'boolean' ? p.correta : null };
  const aceitas = emArray(p.respostasAceitas);
  return { ...base, respostasAceitas: aceitas.length ? aceitas : [''] };
}

export function normalizarQuizDoBanco(id, valor) {
  if (!valor) return null;
  return {
    ...valor,
    id,
    titulo: valor.titulo || 'Quiz sem nome',
    perguntas: emArray(valor.perguntas).map(normalizarPerguntaDoBanco),
  };
}
