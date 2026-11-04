import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { roteador } from './App.jsx';
import { ProvedorAutenticacao } from './ganchos/useAutenticacao.jsx';
import { iniciarRelogio } from './servicos/tempo.js';
import './estilos/global.css';
import './estilos/componentes.css';
import './estilos/jogo.css';
import './estilos/professor.css';
import './estilos/editor.css';
import './estilos/sala.css';
import './estilos/tres.css';
import './estilos/inicio.css';
import './estilos/tutorial.css';

iniciarRelogio();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProvedorAutenticacao>
      <RouterProvider router={roteador} />
    </ProvedorAutenticacao>
  </StrictMode>,
);
