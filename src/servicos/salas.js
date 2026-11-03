/**
 * Salas de jogo: salas/{CODIGO}.
 *
 * Estrutura:
 *   hostUid, quizTitulo, criadaEm, estado ("lobby" | "rodada" | "podio" | "encerrada")
 *   config: { perguntasPorGrupo, tempoPorPergunta }
 *   grupos/{uid}: { nome, entrouEm, pontuacao, acertos, jogou }
 *   rodada: { grupoUid, grupoNome, numero, total, fase, parcial, acertos, pontuacaoAntes }
 *   perguntaAtiva: pergunta SEM gabarito (só host e grupo da vez leem)
 *   correcao: resultado da última pergunta (só host e grupo da vez leem)
 *   respostas/{uid}/{idPergunta}: { valor, respondidoEm }
 *   privado: { quiz (com gabarito), usadas, sorteadas } — só o host
 */
import { ref, get, set, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase.js';
import { gerarCodigo } from '../logica/gerarCodigo.js';
import { limparParaBanco } from './utilidades.js';

export const caminhoSala = (codigo, sub = '') => `salas/${codigo}${sub ? `/${sub}` : ''}`;

export const CONFIG_PADRAO = { perguntasPorGrupo: 5, tempoPorPergunta: 45 };

/** Cria uma sala com código único de 4 letras. Devolve o código. */
export async function criarSala({ quiz, config, usuario }) {
  for (let tentativa = 0; tentativa < 15; tentativa++) {
    const codigo = gerarCodigo();
    const existente = await get(ref(db, caminhoSala(codigo, 'hostUid')));
    if (existente.exists()) continue;

    const perguntas = {};
    quiz.perguntas.forEach((p, i) => {
      perguntas[p.id] = { ...p, ordem: i };
    });

    try {
      await set(
        ref(db, caminhoSala(codigo)),
        limparParaBanco({
          hostUid: usuario.uid,
          quizTitulo: quiz.titulo,
          criadaEm: serverTimestamp(),
          estado: 'lobby',
          config: {
            perguntasPorGrupo: Number(config.perguntasPorGrupo) || CONFIG_PADRAO.perguntasPorGrupo,
            tempoPorPergunta: Number(config.tempoPorPergunta) || CONFIG_PADRAO.tempoPorPergunta,
          },
          privado: { quiz: { titulo: quiz.titulo, perguntas } },
        }),
      );
    } catch (erro) {
      if (String(erro?.code || erro?.message).includes('PERMISSION_DENIED')) continue; // código ocupado
      throw erro;
    }
    await set(ref(db, `usuarios/${usuario.uid}/salas/${codigo}`), {
      quizTitulo: quiz.titulo,
      criadaEm: serverTimestamp(),
    });
    return codigo;
  }
  throw new Error('Não foi possível gerar um código livre. Tente novamente.');
}

/** Lê o estado da sala (null se não existir). */
export async function lerEstadoSala(codigo) {
  const snap = await get(ref(db, caminhoSala(codigo, 'estado')));
  return snap.exists() ? snap.val() : null;
}

/** O grupo entra na fila da sala. */
export function entrarNaSala(codigo, uid, nome) {
  return set(ref(db, caminhoSala(codigo, `grupos/${uid}`)), {
    nome: nome.trim(),
    entrouEm: serverTimestamp(),
    pontuacao: 0,
    acertos: 0,
    jogou: false,
  });
}

export function removerGrupo(codigo, uid) {
  return set(ref(db, caminhoSala(codigo, `grupos/${uid}`)), null);
}

export function encerrarSala(codigo, uidHost) {
  return update(ref(db), {
    [caminhoSala(codigo, 'estado')]: 'encerrada',
    [caminhoSala(codigo, 'perguntaAtiva')]: null,
    [`usuarios/${uidHost}/salas/${codigo}`]: null,
  });
}

/** Grupos em ordem de chegada (a fila). */
export function filaDeGrupos(grupos) {
  return Object.entries(grupos || {})
    .map(([id, g]) => ({ id, ...g }))
    .sort((a, b) => (a.entrouEm || 0) - (b.entrouEm || 0));
}

/** Ranking por pontuação (empate: mais acertos, depois ordem de chegada). */
export function rankingDeGrupos(grupos) {
  return filaDeGrupos(grupos).sort(
    (a, b) => (b.pontuacao || 0) - (a.pontuacao || 0) || (b.acertos || 0) - (a.acertos || 0),
  );
}
