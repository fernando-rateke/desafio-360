/**
 * Relógio sincronizado com o servidor do Firebase.
 * Cada aparelho tem o relógio um pouco diferente; o Firebase informa a
 * diferença em ".info/serverTimeOffset". Usamos isso para o cronômetro ficar
 * igual no projetor e no celular.
 */
import { ref, onValue } from 'firebase/database';
import { db } from './firebase.js';

let diferenca = 0;
let iniciado = false;

export function iniciarRelogio() {
  if (iniciado || !db) return;
  iniciado = true;
  onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
    diferenca = Number(snap.val()) || 0;
  });
}

/** Horário atual estimado do servidor, em ms. */
export function agoraServidor() {
  return Date.now() + diferenca;
}
