import { Routes, Route } from 'react-router-dom';
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
import NaoEncontrado from './paginas/NaoEncontrado.jsx';

export default function App() {
  return (
    <>
      <Fundo />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/professor/login" element={<LoginProfessor />} />
        <Route path="/professor/cadastro" element={<CadastroProfessor />} />
        <Route path="/professor" element={<RotaProtegida><PainelProfessor /></RotaProtegida>} />
        <Route path="/professor/quiz/novo" element={<RotaProtegida><EditorQuiz /></RotaProtegida>} />
        <Route path="/professor/quiz/:id" element={<RotaProtegida><EditorQuiz /></RotaProtegida>} />
        <Route path="/professor/sala/:codigo" element={<RotaProtegida><ControleSala /></RotaProtegida>} />
        <Route path="/entrar" element={<EntrarSala />} />
        <Route path="/sala/:codigo" element={<SalaGrupo />} />
        <Route path="/teste" element={<TesteSolo />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Routes>
    </>
  );
}
