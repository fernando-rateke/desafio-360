import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../servicos/firebase.js';

const ContextoAuth = createContext({ usuario: null, carregando: true });

export function ProvedorAutenticacao({ children }) {
  const [estado, setEstado] = useState({ usuario: null, carregando: Boolean(auth) });

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (usuario) => setEstado({ usuario, carregando: false }));
  }, []);

  return <ContextoAuth.Provider value={estado}>{children}</ContextoAuth.Provider>;
}

export function useAutenticacao() {
  return useContext(ContextoAuth);
}
