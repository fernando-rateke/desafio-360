import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../ganchos/useAutenticacao.jsx';
import Carregando from '../comuns/Carregando.jsx';
import AvisoFirebase from '../comuns/AvisoFirebase.jsx';
import { firebasePronto as firebaseConfigurado } from '../../servicos/firebase.js';

/** Só deixa passar professores logados com e-mail e senha. */
export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAutenticacao();
  const local = useLocation();

  if (!firebaseConfigurado) return <AvisoFirebase />;
  if (carregando) return <Carregando texto="Verificando login…" />;
  if (!usuario || usuario.isAnonymous) {
    return <Navigate to="/professor/login" replace state={{ voltarPara: local.pathname }} />;
  }
  return children;
}
