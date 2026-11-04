import { useState } from 'react';
import { Link } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Roleta3D from '../componentes/tres/Roleta3D.jsx';
import JanelaLeitura from '../componentes/tres/JanelaLeitura.jsx';
import Revelar from '../componentes/comuns/Revelar.jsx';
import { useContagem } from '../ganchos/useContagem.js';
import { useVisivel } from '../ganchos/useVisivel.js';
import { firebasePronto } from '../servicos/firebase.js';

const FORMULAS = [
  'sen²θ + cos²θ = 1',
  'tg θ = sen θ ÷ cos θ',
  'π rad = 180°',
  'sen 30° = 1/2',
  'cos 60° = 1/2',
  'tg 45° = 1',
  'sen 90° = 1',
  'tg 90° ∄',
  '2π rad = 360°',
  'cos 180° = −1',
  'sen(−θ) = −sen θ',
  'cos(−θ) = cos θ',
];

const PASSOS = [
  {
    titulo: 'O professor abre a sala',
    texto: 'Escolhe um quiz e projeta o código de 4 letras e o QR Code no quadro.',
    icone: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="9" width="36" height="24" rx="4" />
        <path d="M18 39h12M24 33v6" />
        <path d="M15 21h6m3 0h9" />
      </svg>
    ),
  },
  {
    titulo: 'Os grupos entram na fila',
    texto: 'Cada grupo lê o QR Code no celular ou no computador e escolhe um nome.',
    icone: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="16" cy="18" r="6" />
        <circle cx="32" cy="18" r="6" />
        <path d="M6 38c1.5-6 6-9 10-9s8.5 3 10 9M22 38c1.5-6 6-9 10-9s8.5 3 10 9" />
      </svg>
    ),
  },
  {
    titulo: 'Um grupo por vez gira a roleta',
    texto: 'As perguntas aparecem no celular do grupo da vez. A resposta está na janela da roleta.',
    icone: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="16" />
        <path d="M24 24l11-6" />
        <rect x="27" y="20" width="14" height="7" rx="1.5" />
        <path d="M10 12a19 19 0 0 1 8-5" />
      </svg>
    ),
  },
  {
    titulo: 'Placar, revezamento e pódio',
    texto: 'Quanto mais rápido, mais pontos. A roleta passa adiante até todos jogarem.',
    icone: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M18 40V22h12v18M6 40V30h12M30 40V26h12" />
        <path d="M24 8l2.5 5 5.5.8-4 3.9.9 5.5L24 20.6l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />
      </svg>
    ),
  },
];

function Numero({ valor, sufixo = '', rotulo, ativo }) {
  const n = useContagem(ativo ? valor : 0, { duracao: 1400 });
  return (
    <div className="numeros__item">
      <strong className="numero">
        {n}
        {sufixo}
      </strong>
      <span>{rotulo}</span>
    </div>
  );
}

export default function Inicio() {
  const [graus, setGraus] = useState(30);
  const [mexeu, setMexeu] = useState(false);
  const [refNumeros, numerosVisiveis] = useVisivel({ umaVez: true });

  return (
    <div className="inicio2">
      <Cabecalho>
        <nav className="nav-inicio so-computador" aria-label="Seções">
          <a href="#como">Como funciona</a>
          <Link to="/tutorial">Tutorial da roleta</Link>
          <Link to="/teste">Treinar</Link>
        </nav>
        <Botao variante="secundario" tamanho="pequeno" para="/professor">
          Sou professor
        </Botao>
      </Cabecalho>

      {/* ---------------- HERO ---------------- */}
      <section className="hero">
        <div className="hero__palco">
          <Roleta3D
            vista="hero"
            demo
            angulo={30}
            aoMudarAngulo={setGraus}
            aoInteragir={() => setMexeu(true)}
            className="hero__roleta"
          >
            <div className={`hero__dica ${mexeu ? 'hero__dica--some' : ''}`} aria-hidden="true">
              <span className="hero__dica-icone">↻</span> Arraste para girar
            </div>
            <JanelaLeitura graus={graus} compacta className="hero__janela" />
          </Roleta3D>
        </div>

        <div className="hero__texto">
          <span className="etiqueta hero__etiqueta">Roleta trigonométrica · 0° a 360°</span>
          <h1 className="hero__titulo">
            <span style={{ '--i': 0 }}>Gire.</span>
            <span style={{ '--i': 1 }}>Leia.</span>
            <span style={{ '--i': 2 }} className="hero__titulo-destaque">
              Responda.
            </span>
          </h1>
          <p className="hero__sub">
            Um quiz de trigonometria em revezamento: cada grupo, na sua vez, usa a roleta de MDF para descobrir seno,
            cosseno, tangente e radianos antes que o tempo acabe.
          </p>
          <div className="hero__acoes">
            <Botao para="/entrar" tamanho="grande" className="botao--brilho">
              Entrar com código
            </Botao>
            <Botao para="/tutorial" variante="secundario" tamanho="grande">
              Como usar a roleta
            </Botao>
          </div>
          <p className="hero__rodape">
            <Link to="/teste">Treinar sozinho no modo de teste →</Link>
            {!firebasePronto && <span className="texto-fraco"> (o Firebase ainda não foi configurado)</span>}
          </p>
        </div>
      </section>

      {/* ---------------- FAIXA DE FÓRMULAS ---------------- */}
      <div className="faixa" aria-hidden="true">
        <div className="faixa__trilho">
          {[...FORMULAS, ...FORMULAS].map((f, i) => (
            <span key={i} className="numero">
              {f}
              <i>◆</i>
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <section id="como" className="secao">
        <Revelar className="secao__cabeca">
          <span className="etiqueta etiqueta--teal">Como funciona</span>
          <h2 className="secao__titulo">
            Uma roleta. Uma turma.
            <br />
            <span>Um grupo de cada vez.</span>
          </h2>
          <p className="texto-suave secao__sub">
            Como só existe uma roleta física, o jogo é um revezamento: enquanto um grupo joga, os outros esperam a vez
            com a tela bloqueada.
          </p>
        </Revelar>

        <ol
          className="passos"
          onPointerMove={(e) => {
            // Brilho que segue o mouse dentro de cada cartão
            const cartao = e.target.closest?.('.passo');
            if (!cartao) return;
            const r = cartao.getBoundingClientRect();
            cartao.style.setProperty('--mx', `${e.clientX - r.left}px`);
            cartao.style.setProperty('--my', `${e.clientY - r.top}px`);
          }}
        >
          {PASSOS.map((p, i) => (
            <Revelar as="li" key={p.titulo} atraso={i * 90} className="passo">
              <span className="passo__numero numero">0{i + 1}</span>
              <span className="passo__icone">{p.icone}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </Revelar>
          ))}
        </ol>
      </section>

      {/* ---------------- REVEZAMENTO ---------------- */}
      <section className="secao secao--revezamento">
        <Revelar className="revezamento">
          <div className="revezamento__texto">
            <span className="etiqueta">Revezamento</span>
            <h2 className="secao__titulo">
              A roleta passa de mão em mão.
              <br />
              <span>O placar sobe para todos verem.</span>
            </h2>
            <p className="texto-suave">
              O projetor mostra o cronômetro gigante e o placar, mas esconde o enunciado para os outros grupos não
              decorarem. Perguntas nunca se repetem entre os grupos.
            </p>
          </div>
          <div className="revezamento__pista" aria-hidden="true">
            {['Os Radianos', 'Seno Mágico', 'Tangentes', 'Arco Íris'].map((nome, i) => (
              <div key={nome} className="revezamento__grupo" style={{ '--i': i }}>
                <span className="revezamento__avatar">{nome[0]}</span>
                <span>{nome}</span>
                <span className="revezamento__pontos numero">{[2840, 2310, 1975, 1620][i]}</span>
              </div>
            ))}
            <span className="revezamento__ficha">
              <svg viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" />
                <path d="M20 20l9-5" />
              </svg>
            </span>
          </div>
        </Revelar>
      </section>

      {/* ---------------- NÚMEROS ---------------- */}
      <section className="secao" ref={refNumeros}>
        <div className="numeros">
          <Numero valor={16} rotulo="ângulos notáveis" ativo={numerosVisiveis} />
          <Numero valor={30} rotulo="perguntas no quiz oficial" ativo={numerosVisiveis} />
          <Numero valor={3} rotulo="tipos de pergunta" ativo={numerosVisiveis} />
          <Numero valor={1000} rotulo="pontos por acerto rápido" ativo={numerosVisiveis} />
        </div>
      </section>

      {/* ---------------- CHAMADA FINAL ---------------- */}
      <section className="secao">
        <Revelar className="chamada">
          <h2>Pronto para girar?</h2>
          <p className="texto-suave">Pegue a roleta, leia o QR Code da base e entre com o código da sala.</p>
          <div className="hero__acoes" style={{ justifyContent: 'center' }}>
            <Botao para="/entrar" tamanho="grande" className="botao--brilho">
              Entrar com código
            </Botao>
            <Botao para="/professor" variante="secundario" tamanho="grande">
              Criar uma sala
            </Botao>
          </div>
        </Revelar>
      </section>

      <footer className="rodape">
        <span>Desafio 360 · feito para a roleta trigonométrica em MDF</span>
        <span>
          <Link to="/tutorial">Tutorial</Link> · <Link to="/teste">Treinar</Link> · <Link to="/professor">Professor</Link>
        </span>
      </footer>
    </div>
  );
}
