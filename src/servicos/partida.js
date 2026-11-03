/**
 * Ações do HOST (tela do professor) durante a partida.
 * Só o host tem o gabarito (salas/{C}/privado), por isso é ele que sorteia,
 * publica a pergunta sem gabarito, corrige e soma os pontos.
 */
import { ref, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase.js';
import { caminhoSala } from './salas.js';
import { sortearPerguntas } from '../logica/sorteio.js';
import { calcularPontos, calcularTempoRestante } from '../logica/pontuacao.js';
import {
  corrigirResposta,
  versaoPublica,
  tempoDaPergunta,
  textoRespostaCorreta,
  textoResposta,
} from '../logica/perguntas.js';
import { emArray, normalizarPerguntaDoBanco, limparParaBanco } from './utilidades.js';

const atualizar = (codigo, mudancas) => {
  const caminhos = {};
  for (const [k, v] of Object.entries(mudancas)) caminhos[caminhoSala(codigo, k)] = v;
  return update(ref(db), limparParaBanco(caminhos));
};

/** Perguntas do quiz da sala (com gabarito), na ordem original. */
export function perguntasDaSala(sala) {
  const lista = Object.values(sala?.privado?.quiz?.perguntas || {});
  return lista.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(normalizarPerguntaDoBanco);
}

/** Quantas perguntas ainda não foram usadas. */
export function perguntasRestantes(sala) {
  const usadas = sala?.privado?.usadas || {};
  return perguntasDaSala(sala).filter((p) => !usadas[p.id]).length;
}

/**
 * Prepara o sorteio de uma rodada. Não grava nada.
 * @returns {{ sorteadas: string[], disponiveis: number, esgotado: boolean }}
 */
export function prepararSorteio(sala) {
  const ids = perguntasDaSala(sala).map((p) => p.id);
  return sortearPerguntas(ids, sala?.privado?.usadas || {}, sala.config.perguntasPorGrupo);
}

/** Começa a rodada de um grupo com as perguntas sorteadas e já publica a 1ª. */
export async function iniciarRodada(codigo, sala, grupoId, sorteadas) {
  const grupo = sala.grupos?.[grupoId];
  if (!grupo || sorteadas.length === 0) return;
  const usadas = {};
  sorteadas.forEach((id) => (usadas[`privado/usadas/${id}`] = true));

  await atualizar(codigo, {
    ...usadas,
    estado: 'rodada',
    'privado/sorteadas': sorteadas,
    rodada: {
      grupoUid: grupoId,
      grupoNome: grupo.nome,
      numero: 0,
      total: sorteadas.length,
      fase: 'preparando',
      parcial: 0,
      acertos: 0,
      pontuacaoAntes: grupo.pontuacao || 0,
    },
    correcao: null,
    perguntaAtiva: null,
    [`respostas/${grupoId}`]: null,
  });
  await publicarPergunta(codigo, { ...sala, privado: { ...sala.privado, sorteadas } }, 0);
}

/** Publica a pergunta de índice `indice` da rodada atual (SEM gabarito). */
export async function publicarPergunta(codigo, sala, indice) {
  const ids = emArray(sala.privado?.sorteadas);
  const pergunta = perguntasDaSala(sala).find((p) => p.id === ids[indice]);
  if (!pergunta) return;
  const tempo = tempoDaPergunta(pergunta, sala.config.tempoPorPergunta);

  await atualizar(codigo, {
    perguntaAtiva: { ...versaoPublica(pergunta, tempo, indice + 1, ids.length), inicioEm: serverTimestamp() },
    correcao: null,
    'rodada/numero': indice + 1,
    'rodada/fase': 'pergunta',
  });
}

/**
 * Corrige a pergunta ativa. `resposta` = { valor, respondidoEm } ou null (tempo esgotado).
 */
export async function corrigirPergunta(codigo, sala, resposta) {
  const ativa = sala.perguntaAtiva;
  const rodada = sala.rodada;
  if (!ativa || !rodada || rodada.fase !== 'pergunta') return;
  const pergunta = perguntasDaSala(sala).find((p) => p.id === ativa.id);
  if (!pergunta) return;

  const grupo = sala.grupos?.[rodada.grupoUid] || {};
  const decorrido = resposta ? resposta.respondidoEm - ativa.inicioEm : Infinity;
  const esgotado = !resposta || decorrido > ativa.tempo * 1000;
  const acertou = !esgotado && corrigirResposta(pergunta, resposta.valor);
  const tempoRestante = resposta ? calcularTempoRestante(ativa.inicioEm, resposta.respondidoEm, ativa.tempo) : 0;
  const pontos = calcularPontos({ acertou, tempoRestante, tempoTotal: ativa.tempo });
  const pontuacaoAnterior = grupo.pontuacao || 0;

  await atualizar(codigo, {
    'rodada/fase': 'resultado',
    'rodada/parcial': (rodada.parcial || 0) + pontos,
    'rodada/acertos': (rodada.acertos || 0) + (acertou ? 1 : 0),
    'rodada/pontuacaoAntes': pontuacaoAnterior,
    [`grupos/${rodada.grupoUid}/pontuacao`]: pontuacaoAnterior + pontos,
    [`grupos/${rodada.grupoUid}/acertos`]: (grupo.acertos || 0) + (acertou ? 1 : 0),
    correcao: {
      idPergunta: ativa.id,
      acertou,
      esgotado,
      pontos,
      tempoRestante: Math.round(tempoRestante * 10) / 10,
      respostaDada: resposta ? textoResposta(pergunta, resposta.valor) : 'Sem resposta',
      valor: resposta ? resposta.valor : null,
      respostaCorreta: textoRespostaCorreta(pergunta),
      correta: pergunta.tipo === 'valor' ? null : pergunta.correta,
      explicacao: pergunta.explicacao || '',
    },
  });
}

/** Professor sai da tela de resultado para o placar animado. */
export function mostrarPlacar(codigo) {
  return atualizar(codigo, { 'rodada/fase': 'placar' });
}

/** Próxima pergunta ou fim da rodada. */
export async function avancar(codigo, sala) {
  const rodada = sala.rodada;
  if (rodada.numero < rodada.total) {
    await publicarPergunta(codigo, sala, rodada.numero);
  } else {
    await atualizar(codigo, {
      'rodada/fase': 'fim',
      perguntaAtiva: null,
      [`grupos/${rodada.grupoUid}/jogou`]: true,
    });
  }
}

/** Vai para o pódio (fim da partida). */
export function irParaPodio(codigo, sala) {
  const mudancas = { estado: 'podio', perguntaAtiva: null, correcao: null };
  if (sala?.rodada?.grupoUid && sala.rodada.fase !== 'fim') {
    mudancas[`grupos/${sala.rodada.grupoUid}/jogou`] = true;
  }
  return atualizar(codigo, mudancas);
}

/** Volta ao lobby sem grupo jogando (ex.: rodada interrompida). */
export function voltarAoLobby(codigo) {
  return atualizar(codigo, { estado: 'lobby', rodada: null, perguntaAtiva: null, correcao: null });
}
