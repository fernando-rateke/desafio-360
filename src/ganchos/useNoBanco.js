import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../servicos/firebase.js';

/**
 * Assina um caminho do Realtime Database e devolve { valor, carregando, erro }.
 * Passe `null` como caminho para não assinar nada.
 */
export function useNoBanco(caminho) {
  const [estado, setEstado] = useState({ valor: null, carregando: Boolean(caminho), erro: null });

  useEffect(() => {
    if (!caminho || !db) {
      setEstado({ valor: null, carregando: false, erro: null });
      return undefined;
    }
    setEstado((e) => ({ ...e, carregando: true }));
    return onValue(
      ref(db, caminho),
      (snap) => setEstado({ valor: snap.val(), carregando: false, erro: null }),
      (erro) => setEstado({ valor: null, carregando: false, erro }),
    );
  }, [caminho]);

  return estado;
}
