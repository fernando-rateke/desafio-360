import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import Cronometro from '../componentes/jogo/Cronometro.jsx';
import CartaoPergunta from '../componentes/jogo/CartaoPergunta.jsx';
import RespostaPergunta from '../componentes/jogo/RespostaPergunta.jsx';
import Feedback from '../componentes/jogo/Feedback.jsx';
import { useCronometro } from '../ganchos/useCronometro.js';
import { useJaComecou } from '../ganchos/useJaComecou.js';
import { useTiqueFinal } from '../ganchos/useTiqueFinal.js';
import Contagem from '../componentes/jogo/Contagem.jsx';
import BotaoSom from '../componentes/comuns/BotaoSom.jsx';
import { tocar } from '../efeitos/sons.js';
import { soltarConfete } from '../efeitos/confete.js';
import { useContagem } from '../ganchos/useContagem.js';
import { quizOficial } from '../dados/quizOficial.js';
import { embaralhar } from '../logica/sorteio.js';
import { calcularPontos, calcularTempoRestante, CONTAGEM_MS } from '../logica/pontuacao.js';
import {
  corrigirResposta,
  textoResposta,
  textoRespostaCorreta,
  tempoDaPergunta,
} from '../logica/perguntas.js';

const QUANTIDADES = [5, 10, 15, 30];
const TEMPOS = [30, 45, 60, 90];

/**
 * Modo de teste solo (/teste): joga o quiz oficial sozinho, sem login e sem
 * Firebase. Usa os mesmos componentes e regras de pontuação da partida real.
 */
export default function TesteSolo() {
  const [fase, setFase] = useState('config'); // config | pergunta | feedback | fim
  const [quantidade, setQuantidade] = useState(5);
  const [tempoPadrao, setTempoPadrao] = useState(45);
  const [perguntas, setPerguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [inicioEm, setInicioEm] = useState(null);
  const [historico, setHistorico] = useState([]);
  const respondendo = useRef(false);

  const pergunta = perguntas[indice];
  const tempo = pergunta ? tempoDaPergunta(pergunta, tempoPadrao) : tempoPadrao;
  const restante = useCronometro(fase === 'pergunta' ? inicioEm : null, tempo, Date.now);
  const comecou = useJaComecou(fase === 'pergunta' ? inicioEm : null);
  useTiqueFinal(restante, fase === 'pergunta' && comecou);
  const total = historico.reduce((s, h) => s + h.pontos, 0);
  const atual = historico[indice];

  const comecar = () => {
    setPerguntas(embaralhar(quizOficial.perguntas).slice(0, quantidade));
    setHistorico([]);
    setIndice(0);
    setInicioEm(Date.now() + CONTAGEM_MS);
    respondendo.current = false;
    setFase('pergunta');
  };

  const responder = useCallback(
    (valor) => {
      if (respondendo.current || !pergunta) return;
      respondendo.current = true;
      const agora = Date.now();
      const esgotado = valor === null;
      const acertou = !esgotado && corrigirResposta(pergunta, valor);
      const tempoRestante = calcularTempoRestante(inicioEm, agora, tempo);
      const pontos = calcularPontos({ acertou, tempoRestante, tempoTotal: tempo });
      setHistorico((h) => [...h, { pergunta, valor, acertou, esgotado, pontos, tempoRestante }]);
      if (acertou) {
        tocar('acerto');
        soltarConfete({ quantidade: 110, origem: { x: 0.5, y: 0.35 } });
      } else tocar('erro');
      setFase('feedback');
    },
    [pergunta, inicioEm, tempo],
  );

  // Tempo esgotado
  useEffect(() => {
    if (fase === 'pergunta' && comecou && restante <= 0) responder(null);
  }, [fase, comecou, restante, responder]);

  const proxima = useCallback(() => {
    if (indice + 1 >= perguntas.length) {
      setFase('fim');
      return;
    }
    setIndice((i) => i + 1);
    setInicioEm(Date.now() + CONTAGEM_MS);
    respondendo.current = false;
    setFase('pergunta');
  }, [indice, perguntas.length]);

  // Enter avança no computador
  useEffect(() => {
    if (fase !== 'feedback') return undefined;
    const tecla = (e) => e.key === 'Enter' && proxima();
    const t = setTimeout(() => window.addEventListener('keydown', tecla), 300);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', tecla);
    };
  }, [fase, proxima]);

  if (fase === 'config') {
    return (
      <>
        <Cabecalho />
        <main className="pagina pagina--estreita">
          <div className="pilha surgir">
            <span className="etiqueta etiqueta--teal" style={{ alignSelf: 'flex-start' }}>
              Modo de teste solo
            </span>
            <h1>Treine com o quiz oficial</h1>
            <p className="texto-suave">
              Jogue sozinho, sem login e sem sala. Pegue a roleta, gire até o ângulo pedido e responda. A pontuação é
              a mesma da partida: acerto vale de 500 a 1000 pontos, conforme a rapidez.
            </p>

            <div className="cartao pilha">
              <div className="pilha pilha--pequena">
                <span className="campo__rotulo">Quantas perguntas?</span>
                <div className="opcoes-chip">
                  {QUANTIDADES.map((q) => (
                    <button key={q} type="button" className="chip numero" aria-pressed={quantidade === q} onClick={() => setQuantidade(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pilha pilha--pequena">
                <span className="campo__rotulo">Tempo por pergunta</span>
                <div className="opcoes-chip">
                  {TEMPOS.map((t) => (
                    <button key={t} type="button" className="chip numero" aria-pressed={tempoPadrao === t} onClick={() => setTempoPadrao(t)}>
                      {t} s
                    </button>
                  ))}
                </div>
              </div>
              <Botao tamanho="grande" bloco onClick={comecar}>
                Começar
              </Botao>
            </div>
            <p className="texto-centro texto-suave" style={{ margin: 0 }}>
              Ainda não conhece a roleta? <Link to="/tutorial">Veja o tutorial</Link>
            </p>
            <p className="texto-fraco texto-centro">No computador: teclas 1–4 escolhem a alternativa, V/F respondem verdadeiro ou falso e Enter avança.</p>
          </div>
        </main>
      </>
    );
  }

  if (fase === 'fim') {
    return <ResultadoSolo historico={historico} total={total} aoJogarNovamente={() => setFase('config')} />;
  }

  return (
    <>
      <div className="barra-jogo">
        <div className="barra-jogo__info">
          <span className="barra-jogo__grupo">Modo de teste</span>
          <span className="barra-jogo__pontos">{total} pts</span>
        </div>
        <div className="so-celular">
          <Cronometro restante={fase === 'feedback' ? (atual?.tempoRestante ?? 0) : restante} total={tempo} tamanho="compacto" />
        </div>
        <div className="linha" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <BotaoSom />
          <Botao variante="fantasma" tamanho="pequeno" onClick={() => setFase('fim')}>
            Encerrar
          </Botao>
        </div>
      </div>
      {fase === 'pergunta' && (
        <Contagem inicio={inicioEm} titulo={`Pergunta ${indice + 1} de ${perguntas.length} · peguem a roleta!`} />
      )}

      <main className="area-jogo">
        <div className="area-jogo__cabeca">
          <CartaoPergunta pergunta={pergunta} numero={indice + 1} total={perguntas.length} />
          <div className="so-computador">
            <Cronometro restante={fase === 'feedback' ? (atual?.tempoRestante ?? 0) : restante} total={tempo} tamanho="lateral" />
          </div>
        </div>

        <RespostaPergunta
          key={pergunta.id}
          pergunta={pergunta}
          aoResponder={responder}
          bloqueado={fase !== 'pergunta' || !comecou}
          valorEnviado={atual?.valor}
          correta={fase === 'feedback' ? pergunta.correta ?? null : null}
        />

        {fase === 'feedback' && atual && (
          <Feedback
            acertou={atual.acertou}
            esgotado={atual.esgotado}
            pontos={atual.pontos}
            respostaDada={textoResposta(pergunta, atual.valor)}
            respostaCorreta={textoRespostaCorreta(pergunta)}
            explicacao={pergunta.explicacao}
          >
            <Botao tamanho="grande" bloco onClick={proxima} style={{ marginTop: 16 }} autoFocus>
              {indice + 1 >= perguntas.length ? 'Ver resultado' : 'Próxima pergunta →'}
            </Botao>
          </Feedback>
        )}
      </main>
    </>
  );
}

function ResultadoSolo({ historico, total, aoJogarNovamente }) {
  const acertos = historico.filter((h) => h.acertou).length;
  const pontosAnimados = useContagem(total, { duracao: 1500 });
  useEffect(() => {
    if (historico.length && historico.filter((h) => h.acertou).length / historico.length >= 0.7) {
      tocar('fanfarra');
      soltarConfete({ quantidade: 200, origem: { x: 0.5, y: 0.4 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const aproveitamento = historico.length ? Math.round((acertos / historico.length) * 100) : 0;
  const mensagem = useMemo(() => {
    if (aproveitamento === 100) return 'Gabaritou! Domínio total do círculo trigonométrico.';
    if (aproveitamento >= 70) return 'Muito bem! Revise os itens que errou e tente de novo.';
    if (aproveitamento >= 40) return 'Bom começo. Use a roleta para conferir os quadrantes.';
    return 'Continue treinando: comece pelos ângulos de 30°, 45° e 60°.';
  }, [aproveitamento]);

  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--media">
        <div className="pilha surgir">
          <h1 className="texto-centro">Resultado</h1>
          <div className="grade-numeros">
            <div>
              <strong>{pontosAnimados}</strong>
              <span>pontos</span>
            </div>
            <div>
              <strong>
                {acertos}/{historico.length}
              </strong>
              <span>acertos</span>
            </div>
            <div>
              <strong>{aproveitamento}%</strong>
              <span>aproveitamento</span>
            </div>
          </div>
          <Aviso tipo={aproveitamento >= 70 ? 'sucesso' : 'info'}>
            <p>{mensagem}</p>
          </Aviso>

          {historico.length > 0 && (
            <ol className="resumo-lista">
              {historico.map((h, i) => (
                <li key={h.pergunta.id}>
                  <span className={`resumo-lista__marca ${h.acertou ? 'resumo-lista__marca--ok' : 'resumo-lista__marca--erro'}`}>
                    {h.acertou ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>
                      {i + 1}. {h.pergunta.enunciado}
                    </strong>
                    <div className="texto-fraco">
                      Sua resposta: {textoResposta(h.pergunta, h.valor)} · Correta: {textoRespostaCorreta(h.pergunta)}
                    </div>
                  </div>
                  <span className="numero">+{h.pontos}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="linha" style={{ justifyContent: 'center' }}>
            <Botao tamanho="grande" onClick={aoJogarNovamente}>
              Jogar de novo
            </Botao>
            <Botao variante="secundario" tamanho="grande" para="/">
              Início
            </Botao>
          </div>
        </div>
      </main>
    </>
  );
}
