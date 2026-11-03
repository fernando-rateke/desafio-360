/**
 * Autenticação:
 *  - Professor: e-mail e senha.
 *  - Grupo: login anônimo (invisível) — dá um uid para as regras de segurança.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, set, serverTimestamp } from 'firebase/database';
import { auth, db } from './firebase.js';

export async function cadastrarProfessor({ nome, email, senha }) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), senha);
  await updateProfile(user, { displayName: nome.trim() });
  await set(ref(db, `usuarios/${user.uid}`), {
    nome: nome.trim(),
    email: user.email,
    criadoEm: serverTimestamp(),
  });
  return user;
}

export async function entrarProfessor({ email, senha }) {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), senha);
  return user;
}

export function recuperarSenha(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function sair() {
  return signOut(auth);
}

/**
 * Garante que o grupo tenha um uid. Se já houver alguém logado (inclusive um
 * professor testando no mesmo navegador), reaproveita.
 */
export async function garantirLoginGrupo() {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

/** Traduz os códigos de erro do Firebase Auth. */
export function mensagemErroAuth(erro) {
  const codigo = erro?.code || '';
  const mensagens = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/missing-password': 'Digite a senha.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/operation-not-allowed':
      'Esse método de login não está ativado no Firebase (veja o README: Authentication → Métodos de login).',
    'auth/unauthorized-domain':
      'Este endereço não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).',
    'auth/admin-restricted-operation':
      'O login anônimo não está ativado no Firebase (Authentication → Métodos de login → Anônimo).',
  };
  return mensagens[codigo] || 'Algo deu errado. Tente novamente.';
}
