/**
 * Quizzes do professor, guardados em quizzes/{uidDoProfessor}/{quizId}.
 * Só o dono lê e grava (ver database.rules.json).
 */
import { ref, push, set, update, remove, get, serverTimestamp } from 'firebase/database';
import { db } from './firebase.js';
import { limparParaBanco, normalizarQuizDoBanco } from './utilidades.js';
import { quizOficial, ID_QUIZ_OFICIAL } from '../dados/quizOficial.js';
import { gerarIdPergunta } from '../logica/perguntas.js';

const caminho = (uid, id = '') => `quizzes/${uid}${id ? `/${id}` : ''}`;

export async function carregarQuiz(uid, id) {
  if (id === ID_QUIZ_OFICIAL) return quizOficial;
  const snap = await get(ref(db, caminho(uid, id)));
  return normalizarQuizDoBanco(id, snap.val());
}

/** Prepara o quiz para gravar (sem id, sem campos extras). */
function paraBanco(quiz) {
  return limparParaBanco({
    titulo: quiz.titulo.trim(),
    perguntas: quiz.perguntas.map((p) => {
      const base = {
        id: p.id,
        tipo: p.tipo,
        enunciado: p.enunciado.trim(),
        explicacao: (p.explicacao || '').trim(),
        tempo: p.tempo ? Number(p.tempo) : null,
      };
      if (p.tipo === 'multipla') return { ...base, alternativas: p.alternativas.map((a) => a.trim()), correta: p.correta };
      if (p.tipo === 'vf') return { ...base, correta: p.correta };
      return { ...base, respostasAceitas: p.respostasAceitas.map((r) => r.trim()).filter(Boolean) };
    }),
  });
}

/** Cria (sem id) ou atualiza um quiz. Devolve o id. */
export async function salvarQuiz(uid, quiz) {
  const dados = paraBanco(quiz);
  if (quiz.id && quiz.id !== ID_QUIZ_OFICIAL) {
    await update(ref(db, caminho(uid, quiz.id)), { ...dados, atualizadoEm: serverTimestamp() });
    return quiz.id;
  }
  const novo = push(ref(db, caminho(uid)));
  await set(novo, { ...dados, criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() });
  return novo.key;
}

export async function duplicarQuiz(uid, quiz) {
  const titulo = quiz.oficial ? `${quiz.titulo.replace(' — Oficial', '')} (minha cópia)` : `Cópia de ${quiz.titulo}`;
  return salvarQuiz(uid, {
    titulo,
    perguntas: quiz.perguntas.map((p) => ({ ...p, id: quiz.oficial ? gerarIdPergunta() : p.id })),
  });
}

export function renomearQuiz(uid, id, titulo) {
  return update(ref(db, caminho(uid, id)), { titulo: titulo.trim(), atualizadoEm: serverTimestamp() });
}

export function excluirQuiz(uid, id) {
  return remove(ref(db, caminho(uid, id)));
}
