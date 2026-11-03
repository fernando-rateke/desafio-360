import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ProvedorAutenticacao } from './ganchos/useAutenticacao.jsx';
import { iniciarRelogio } from './servicos/tempo.js';
import './estilos/global.css';
import './estilos/componentes.css';
import './estilos/jogo.css';
import './estilos/professor.css';
import './estilos/editor.css';

iniciarRelogio();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorAutenticacao>
        <App />
      </ProvedorAutenticacao>
    </BrowserRouter>
  </StrictMode>,
);
