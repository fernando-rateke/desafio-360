import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import BotaoSom from '../componentes/comuns/BotaoSom.jsx';
import Roleta3D from '../componentes/tres/Roleta3D.jsx';
import JanelaLeitura from '../componentes/tres/JanelaLeitura.jsx';
import Pratica from '../componentes/tutorial/Pratica.jsx';
import { SINAIS_QUADRANTE } from '../logica/angulos.js';

/**
 * Tutorial da roleta física. A roleta 3D fica fixa enquanto os capítulos
 * passam; cada capítulo gira o disco, move a câmera e acende uma parte.
 */
const CAPITULOS = [
  {
    id: 'conheca',
    rotulo: 'A roleta',
    cena: { angulo: 0, vista: 'geral', destaque: null, demo: true },
    titulo: 'Conheça a roleta',
    corpo: (
      <>
        <p>A roleta trigonométrica tem três partes. Cada uma tem uma função:</p>
        <ul className="lista-partes">
          <li>
            <b>Base de MDF</b> — fica parada sobre a mesa.
          </li>
          <li>
            <b>Disco giratório</b> — tem os 16 ângulos notáveis gravados.
          </li>
          <li>
            <b>Janela</b> — mostra os valores do ângulo escolhido.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'base',
    rotulo: 'Base',
    cena: { angulo: 45, vista: 'lado', destaque: 'base' },
    titulo: 'Segure a base firme',
    corpo: (
      <>
        <p>Apoie a roleta na mesa e segure a base com uma das mãos: ela não deve girar.</p>
        <p>
          Os números romanos nos cantos (<b>I, II, III e IV</b>) lembram os quatro quadrantes do círculo trigonométrico.
        </p>
      </>
    ),
  },
  {
    id: 'disco',
    rotulo: 'Disco',
    cena: { angulo: 120, vista: 'geral', destaque: 'disco' },
    titulo: 'Gire o disco',
    corpo: (
      <>
        <p>
          Com a outra mão, gire o disco. Os ângulos crescem no <b>sentido anti-horário</b>, igual ao círculo
          trigonométrico: 0°, 30°, 45°, 60°, 90°…
        </p>
        <p>Gire devagar no final: cada ângulo tem o seu espaço, separado por linhas.</p>
      </>
    ),
  },
  {
    id: 'janela',
    rotulo: 'Janela',
    cena: { angulo: 30, vista: 'janela', destaque: 'janela', destacar: 'graus' },
    titulo: 'Leia pela janela',
    corpo: (
      <>
        <p>O ângulo que fica embaixo da janela é o ângulo escolhido. Pela janela você lê:</p>
        <ul className="lista-partes">
          <li>o ângulo em <b>graus</b> e em <b>radianos</b>;</li>
          <li>
            o <b>seno</b>, o <b>cosseno</b> e a <b>tangente</b> desse ângulo.
          </li>
        </ul>
        <p className="texto-suave">O painel ao lado reproduz exatamente o que aparece na janela.</p>
      </>
    ),
  },
  {
    id: 'exemplo',
    rotulo: 'Exemplo',
    cena: { angulo: 150, vista: 'janela', destaque: 'janela', destacar: 'sen' },
    titulo: 'Exemplo: quanto vale sen 150°?',
    corpo: (
      <ol className="passos-exemplo">
        <li>
          <b>Leia a pergunta</b> no celular: o ângulo é <b>150°</b>.
        </li>
        <li>
          <b>Gire o disco</b> até o 150° ficar embaixo da janela.
        </li>
        <li>
          <b>Leia a linha "sen"</b>: aparece <b className="numero">1/2</b>.
        </li>
        <li>
          <b>Responda</b> rápido: quanto antes, mais pontos (até 1000).
        </li>
      </ol>
    ),
  },
  {
    id: 'quadrantes',
    rotulo: 'Sinais',
    cena: { angulo: 225, vista: 'topo', destaque: 'quadrantes', destacar: 'cos' },
    titulo: 'O sinal muda com o quadrante',
    corpo: (
      <>
        <p>As cores mostram os quatro quadrantes. Em cada um, o sinal de seno, cosseno e tangente muda:</p>
        <div className="tabela-sinais" role="table" aria-label="Sinais por quadrante">
          <div role="row" className="tabela-sinais__cabeca">
            <span role="columnheader" />
            <span role="columnheader">sen</span>
            <span role="columnheader">cos</span>
            <span role="columnheader">tg</span>
          </div>
          {[1, 2, 3, 4].map((q) => (
            <div role="row" key={q} className={`tabela-sinais__linha tabela-sinais__linha--${q}`}>
              <span role="rowheader">{q}º quadrante</span>
              {['sen', 'cos', 'tg'].map((f) => (
                <span role="cell" key={f} className={SINAIS_QUADRANTE[q][f] === '+' ? 'sinal-mais' : 'sinal-menos'}>
                  {SINAIS_QUADRANTE[q][f]}
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="texto-suave">Ex.: 225° está no 3º quadrante, então o cosseno é negativo: −√2/2.</p>
      </>
    ),
  },
  {
    id: 'tangente',
    rotulo: 'Tangente',
    cena: { angulo: 90, vista: 'topo', destaque: 'eixos', destacar: 'tg' },
    titulo: 'Quando a tangente não existe',
    corpo: (
      <>
        <p>
          Em <b>90°</b> e <b>270°</b> o cosseno vale zero. Como tg = sen ÷ cos, a divisão por zero não existe, e a
          janela mostra <b className="numero">∄</b>.
        </p>
        <p>
          No jogo, nas perguntas de digitar, escreva <b>"não existe"</b>. Há um botão pronto para isso no celular.
        </p>
      </>
    ),
  },
  {
    id: 'radianos',
    rotulo: 'Radianos',
    cena: { angulo: 270, vista: 'janela', destaque: 'janela', destacar: 'radianos' },
    titulo: 'Graus e radianos',
    corpo: (
      <>
        <p>
          Para converter, lembre que <b className="numero">180° = π rad</b>. Então 270° = 270 × π/180 ={' '}
          <b className="numero">3π/2</b>.
        </p>
        <p>
          A janela já traz o valor em radianos: confira na roleta antes de responder. No celular, há botões para{' '}
          <b>√</b> e <b>π</b>.
        </p>
      </>
    ),
  },
  {
    id: 'revezamento',
    rotulo: 'Na partida',
    cena: { angulo: 60, vista: 'hero', destaque: null, demo: true },
    titulo: 'Na partida: trabalho em equipe',
    corpo: (
      <>
        <ul className="lista-partes">
          <li>
            <b>Um gira</b> o disco, <b>outro lê</b> a janela e <b>outro responde</b> no celular.
          </li>
          <li>O cronômetro corre para todos: quanto mais rápido, mais pontos.</li>
          <li>
            Terminou a rodada? <b>Passe a roleta</b> para o próximo grupo da fila.
          </li>
        </ul>
        <Botao
          tamanho="grande"
          className="botao--brilho"
          onClick={() => document.getElementById('praticar')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Praticar agora ↓
        </Botao>
      </>
    ),
  },
];

export default function Tutorial() {
  const [ativo, setAtivo] = useState(0);
  const [graus, setGraus] = useState(0);
  const refs = useRef([]);

  // Capítulo ativo = o que cruza o meio da tela
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setAtivo(Number(e.target.dataset.indice));
        }
      },
      // No celular a roleta ocupa a parte de cima da tela: a linha de leitura fica mais embaixo
      { rootMargin: window.innerWidth < 960 ? '-66% 0px -30% 0px' : '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const cap = CAPITULOS[ativo];
  const irPara = (i) => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="tutorial">
      <Cabecalho>
        <BotaoSom />
        <Botao variante="secundario" tamanho="pequeno" para="/entrar">
          Entrar com código
        </Botao>
      </Cabecalho>

      <header className="tutorial__abertura">
        <span className="etiqueta etiqueta--teal">Tutorial · 2 minutos</span>
        <h1>
          Como usar a <span>roleta trigonométrica</span>
        </h1>
        <p className="texto-suave">Role a página: a roleta 3D mostra cada passo. No fim, pratique encontrando ângulos.</p>
        <span className="tutorial__rolar" aria-hidden="true">
          <span />
        </span>
      </header>

      <div className="tutorial__corpo">
        <div className="tutorial__palco">
          <Roleta3D
            angulo={cap.cena.angulo}
            vista={cap.cena.vista}
            destaque={cap.cena.destaque}
            demo={!!cap.cena.demo}
            aoMudarAngulo={setGraus}
            className="tutorial__roleta"
          />
          <JanelaLeitura graus={graus} destacar={cap.cena.destacar} compacta className="tutorial__janela" />
          <nav className="tutorial__progresso" aria-label="Capítulos">
            {CAPITULOS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={i === ativo ? 'ativo' : i < ativo ? 'feito' : ''}
                onClick={() => irPara(i)}
                aria-label={`${i + 1}. ${c.rotulo}`}
                aria-current={i === ativo ? 'step' : undefined}
              >
                <span>{c.rotulo}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="tutorial__capitulos">
          {CAPITULOS.map((c, i) => (
            <section
              key={c.id}
              ref={(el) => (refs.current[i] = el)}
              data-indice={i}
              className={`capitulo ${i === ativo ? 'capitulo--ativo' : ''}`}
              aria-labelledby={`cap-${c.id}`}
            >
              <div className="capitulo__cartao">
                <span className="capitulo__numero numero">
                  {String(i + 1).padStart(2, '0')} / {String(CAPITULOS.length).padStart(2, '0')}
                </span>
                <h2 id={`cap-${c.id}`}>{c.titulo}</h2>
                <div className="capitulo__corpo">{c.corpo}</div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <section id="praticar" className="secao">
        <Pratica />
      </section>

      <section className="secao">
        <div className="chamada">
          <h2>Tudo pronto!</h2>
          <p className="texto-suave">Agora é com vocês: entrem na sala ou treinem com as 30 perguntas do quiz oficial.</p>
          <div className="hero__acoes" style={{ justifyContent: 'center' }}>
            <Botao para="/entrar" tamanho="grande" className="botao--brilho">
              Entrar com código
            </Botao>
            <Botao para="/teste" variante="secundario" tamanho="grande">
              Treinar no modo de teste
            </Botao>
          </div>
        </div>
      </section>

      <footer className="rodape">
        <span>Desafio 360 · tutorial da roleta</span>
        <Link to="/">Voltar ao início</Link>
      </footer>
    </div>
  );
}
