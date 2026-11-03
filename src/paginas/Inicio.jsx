import { Link } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import { firebaseConfigurado } from '../servicos/firebase.js';

export default function Inicio() {
  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--media pagina--centro inicio">
        <div className="inicio__hero surgir">
          <span className="etiqueta">Roleta trigonométrica · 0° a 360°</span>
          <h1 className="inicio__titulo">
            Gire a roleta.
            <br />
            <span>Responda antes do tempo acabar.</span>
          </h1>
          <p className="texto-suave inicio__sub">
            Os grupos jogam em revezamento: um de cada vez com a roleta, descobrindo seno, cosseno, tangente e radianos.
          </p>
        </div>

        <div className="inicio__escolhas surgir" style={{ animationDelay: '80ms' }}>
          <Link to="/entrar" className="escolha escolha--grupo">
            <span className="escolha__icone" aria-hidden="true">
              #
            </span>
            <span className="escolha__titulo">Entrar com código</span>
            <span className="escolha__texto">Para os grupos: digite o código de 4 letras da sala.</span>
          </Link>
          <Link to="/professor" className="escolha escolha--professor">
            <span className="escolha__icone" aria-hidden="true">
              θ
            </span>
            <span className="escolha__titulo">Sou professor</span>
            <span className="escolha__texto">Crie quizzes, abra uma sala e conduza a partida no projetor.</span>
          </Link>
        </div>

        <p className="texto-centro texto-fraco surgir" style={{ animationDelay: '160ms' }}>
          Quer só treinar? <Link to="/teste">Jogue o quiz oficial no modo de teste</Link>
          {!firebaseConfigurado && ' (o Firebase ainda não foi configurado).'}
        </p>
      </main>
    </>
  );
}
