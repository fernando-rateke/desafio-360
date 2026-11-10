import { createBrowserRouter, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import Fundo from './componentes/layout/Fundo.jsx';
import RotaProtegida from './componentes/layout/RotaProtegida.jsx';
import Inicio from './paginas/Inicio.jsx';
import LoginProfessor from './paginas/LoginProfessor.jsx';
import CadastroProfessor from './paginas/CadastroProfessor.jsx';
import PainelProfessor from './paginas/PainelProfessor.jsx';
import EditorQuiz from './paginas/EditorQuiz.jsx';
import ControleSala from './paginas/ControleSala.jsx';
import EntrarSala from './paginas/EntrarSala.jsx';
import SalaGrupo from './paginas/SalaGrupo.jsx';
import TesteSolo from './paginas/TesteSolo.jsx';
import Tutorial from './paginas/Tutorial.jsx';
import Fabricacao from './paginas/Fabricacao.jsx';
import NaoEncontrado from './paginas/NaoEncontrado.jsx';

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <Fundo />
      {/* A chave muda a cada página: a animação de entrada roda de novo */}
      <div key={pathname} className="transicao-pagina">
        <Outlet />
      </div>
      <ScrollRestoration />
    </>
  );
}

const protegida = (elemento) => <RotaProtegida>{elemento}</RotaProtegida>;

export const roteador = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Inicio /> },
      { path: '/professor/login', element: <LoginProfessor /> },
      { path: '/professor/cadastro', element: <CadastroProfessor /> },
      { path: '/professor', element: protegida(<PainelProfessor />) },
      { path: '/professor/quiz/novo', element: protegida(<EditorQuiz />) },
      { path: '/professor/quiz/:id', element: protegida(<EditorQuiz />) },
      { path: '/professor/sala/:codigo', element: protegida(<ControleSala />) },
      { path: '/entrar', element: <EntrarSala /> },
      { path: '/sala/:codigo', element: <SalaGrupo /> },
      { path: '/teste', element: <TesteSolo /> },
      { path: '/tutorial', element: <Tutorial /> },
      { path: '/fabricacao', element: <Fabricacao /> },
      { path: '*', element: <NaoEncontrado /> },
    ],
  },
]);
