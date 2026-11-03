/**
 * Inicialização do Firebase.
 * Se o .env não estiver preenchido, `firebaseConfigurado` fica false e o app
 * continua funcionando no modo de teste (/teste).
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const configuracao = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(
  configuracao.apiKey && configuracao.databaseURL && configuracao.projectId && configuracao.appId,
);

let app = null;
let auth = null;
let db = null;

if (firebaseConfigurado) {
  try {
    app = initializeApp(configuracao);
    auth = getAuth(app);
    db = getDatabase(app);
  } catch (erro) {
    console.error('Não foi possível iniciar o Firebase. Confira o .env.', erro);
  }
} else if (import.meta.env.DEV) {
  console.info('[Desafio 360] Firebase não configurado — apenas o modo de teste (/teste) está disponível.');
}

export { app, auth, db };
