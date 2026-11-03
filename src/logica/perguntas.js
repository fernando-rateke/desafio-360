/**
 * Utilidades sobre perguntas: tipos, correção, validação e "versão pública"
 * (sem gabarito) que vai para o celular do grupo.
 */
import { compararResposta } from './normalizarResposta.js';

export const TIPOS = {
  multipla: 'Múltipla escolha',
  vf: 'Verdadeiro ou falso',
  valor: 'Digitar o valor',
};

/** Cria uma pergunta vazia de um tipo. */
export function novaPergunta(tipo = 'multipla') {
  const base = {
    id: gerarIdPergunta(),
    tipo,
    enunciado: '',
    explicacao: '',
    tempo: null,
  };
  if (tipo === 'multipla') return { ...base, alternativas: ['', '', '', ''], correta: null };
  if (tipo === 'vf') return { ...base, correta: null };
  return { ...base, respostasAceitas: [''] };
}

export function gerarIdPergunta() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Troca o tipo de uma pergunta mantendo enunciado, explicação e tempo.
 */
export function mudarTipo(pergunta, tipo) {
  const nova = novaPergunta(tipo);
  return {
    ...nova,
    id: pergunta.id,
    enunciado: pergunta.enunciado,
    explicacao: pergunta.explicacao,
    tempo: pergunta.tempo ?? null,
  };
}

/**
 * Lista de erros que impedem salvar a pergunta (vazia = válida).
 */
export function validarPergunta(p) {
  const erros = [];
  if (!p || !TIPOS[p.tipo]) return ['Tipo de pergunta inválido.'];
  if (!String(p.enunciado || '').trim()) erros.push('Escreva o enunciado.');

  if (p.tipo === 'multipla') {
    const alts = p.alternativas || [];
    if (alts.length !== 4 || alts.some((a) => !String(a || '').trim())) {
      erros.push('Preencha as 4 alternativas.');
    }
    if (!Number.isInteger(p.correta) || p.correta < 0 || p.correta > 3) {
      erros.push('Marque a alternativa correta (gabarito).');
    }
  } else if (p.tipo === 'vf') {
    if (typeof p.correta !== 'boolean') erros.push('Escolha se a afirmação é verdadeira ou falsa (gabarito).');
  } else if (p.tipo === 'valor') {
    const aceitas = (p.respostasAceitas || []).filter((r) => String(r || '').trim());
    if (aceitas.length === 0) erros.push('Cadastre pelo menos uma resposta aceita (gabarito).');
  }

  if (p.tempo !== null && p.tempo !== undefined && p.tempo !== '') {
    const t = Number(p.tempo);
    if (!Number.isFinite(t) || t < 5 || t > 300) erros.push('O tempo personalizado deve ficar entre 5 e 300 segundos.');
  }
  return erros;
}

/** Valida o quiz inteiro. Retorna { titulo: string[], perguntas: {indice, erros}[] }. */
export function validarQuiz(quiz) {
  const tituloErros = String(quiz?.titulo || '').trim() ? [] : ['Dê um nome ao quiz.'];
  const perguntas = (quiz?.perguntas || [])
    .map((p, indice) => ({ indice, erros: validarPergunta(p) }))
    .filter((r) => r.erros.length > 0);
  const semPerguntas = (quiz?.perguntas || []).length === 0 ? ['Adicione pelo menos uma pergunta.'] : [];
  return {
    titulo: [...tituloErros, ...semPerguntas],
    perguntas,
    valido: tituloErros.length === 0 && semPerguntas.length === 0 && perguntas.length === 0,
  };
}

/**
 * Corrige a resposta de um grupo.
 * @param {object} pergunta pergunta completa (com gabarito)
 * @param {unknown} valor resposta enviada (índice, booleano ou texto)
 */
export function corrigirResposta(pergunta, valor) {
  if (valor === null || valor === undefined) return false;
  switch (pergunta.tipo) {
    case 'multipla':
      return Number(valor) === pergunta.correta;
    case 'vf':
      return valor === pergunta.correta || String(valor) === String(pergunta.correta);
    case 'valor':
      return compararResposta(String(valor), pergunta.respostasAceitas || []);
    default:
      return false;
  }
}

/** Texto legível da resposta correta (para o feedback e o "Revelar na tela"). */
export function textoRespostaCorreta(pergunta) {
  if (pergunta.tipo === 'multipla') {
    const letra = 'ABCD'[pergunta.correta];
    return `${letra}) ${pergunta.alternativas[pergunta.correta]}`;
  }
  if (pergunta.tipo === 'vf') return pergunta.correta ? 'Verdadeiro' : 'Falso';
  return (pergunta.respostasAceitas || []).filter(Boolean)[0] || '';
}

/** Texto legível da resposta que o grupo deu. */
export function textoResposta(pergunta, valor) {
  if (valor === null || valor === undefined || valor === '') return 'Sem resposta';
  if (pergunta.tipo === 'multipla') {
    const i = Number(valor);
    return `${'ABCD'[i]}) ${pergunta.alternativas?.[i] ?? ''}`;
  }
  if (pergunta.tipo === 'vf') return valor === true || valor === 'true' ? 'Verdadeiro' : 'Falso';
  return String(valor);
}

/**
 * Versão PÚBLICA da pergunta: só o que o grupo precisa ver.
 * Nunca inclui `correta`, `respostasAceitas` nem `explicacao`.
 */
export function versaoPublica(pergunta, tempo, numero, total) {
  const publica = {
    id: pergunta.id,
    tipo: pergunta.tipo,
    enunciado: pergunta.enunciado,
    tempo,
    numero,
    total,
  };
  if (pergunta.tipo === 'multipla') publica.alternativas = [...pergunta.alternativas];
  return publica;
}

/** Tempo efetivo da pergunta: personalizado ou o padrão da sala. */
export function tempoDaPergunta(pergunta, tempoPadrao) {
  const t = Number(pergunta.tempo);
  return Number.isFinite(t) && t > 0 ? t : tempoPadrao;
}
