import { useEffect, useRef, useState } from 'react';
import Botao from '../comuns/Botao.jsx';
import Roleta3D from '../tres/Roleta3D.jsx';
import JanelaLeitura from '../tres/JanelaLeitura.jsx';
import { useVisivel } from '../../ganchos/useVisivel.js';
import { ANGULOS_NOTAVEIS, anguloNotavelMaisProximo } from '../../logica/angulos.js';
import { gerarDesafios, FUNCOES } from '../../logica/pratica.js';
import { soltarConfete } from '../../efeitos/confete.js';
import { tocar } from '../../efeitos/sons.js';

const NOME_CURTO = { sen: 'sen', cos: 'cos', tg: 'tg', radianos: 'rad' };
const TOTAL = 5;

/**
 * Mini-jogo: encontre o ângulo girando a roleta e leia o valor pedido.
 */
export default function Pratica() {
  const [refVisivel, visivel] = useVisivel({ umaVez: true, margem: '200px 0px' });
  const roleta = useRef(null);
  const [fase, setFase] = useState('inicio'); // inicio | procurando | achou | resposta | fim
  const [desafios, setDesafios] = useState([]);
  const [indice, setIndice] = useState(0);
  const [graus, setGraus] = useState(0);
  const [escolha, setEscolha] = useState(null);
  const [acertos, setAcertos] = useState(0);

  const desafio = desafios[indice];

  const comecar = () => {
    setDesafios(gerarDesafios(TOTAL));
    setIndice(0);
    setAcertos(0);
    setEscolha(null);
    roleta.current?.setAngulo(0);
    setFase('procurando');
    tocar('clique');
  };

  // Achou o ângulo? Espera um instante parado em cima dele
  useEffect(() => {
    if (fase !== 'procurando' || !desafio || graus !== desafio.graus) return undefined;
    const t = setTimeout(() => {
      setFase('achou');
      tocar('entrou');
      roleta.current?.comemorar();
    }, 350);
    return () => clearTimeout(t);
  }, [fase, desafio, graus]);

  const passo = (dir) => {
    const lista = ANGULOS_NOTAVEIS.map((a) => a.graus);
    const atual = lista.indexOf(anguloNotavelMaisProximo(graus).graus);
    const novo = lista[(atual + dir + lista.length) % lista.length];
    roleta.current?.setAngulo(novo);
    tocar('tique');
  };

  const responder = (opcao) => {
    setEscolha(opcao);
    setFase('resposta');
    if (opcao === desafio.correta) {
      setAcertos((a) => a + 1);
      tocar('acerto');
      soltarConfete({ quantidade: 90, origem: { x: 0.5, y: 0.55 } });
    } else {
      tocar('erro');
    }
  };

  const proximo = () => {
    if (indice + 1 >= TOTAL) {
      setFase('fim');
      if (acertos >= 4) {
        tocar('fanfarra');
        soltarConfete({ quantidade: 200, origem: { x: 0.5, y: 0.5 } });
      }
      return;
    }
    setIndice((i) => i + 1);
    setEscolha(null);
    setFase('procurando');
  };

  return (
    <div className="pratica" ref={refVisivel}>
      <div className="pratica__cabeca">
        <span className="etiqueta">Pratique</span>
        <h2 className="secao__titulo">
          Encontre o ângulo. <span>Leia o valor.</span>
        </h2>
        <p className="texto-suave">
          Gire a roleta virtual (arraste, deslize no celular ou use as setas) até o ângulo pedido ficar sob a janela.
        </p>
      </div>

      <div className="pratica__grade">
        <div className="pratica__palco">
          {visivel ? (
            <Roleta3D ref={roleta} angulo={0} vista="topo" aoMudarAngulo={setGraus} className="pratica__roleta" />
          ) : (
            <div className="pratica__roleta" />
          )}
          <div className="pratica__setas">
            <button type="button" className="botao botao--secundario" onClick={() => passo(-1)} aria-label="Girar para o ângulo anterior">
              ◀ anterior
            </button>
            <span className="pratica__grau numero">{anguloNotavelMaisProximo(graus).graus}°</span>
            <button type="button" className="botao botao--secundario" onClick={() => passo(1)} aria-label="Girar para o próximo ângulo">
              próximo ▶
            </button>
          </div>
        </div>

        <div className="pratica__painel cartao" aria-live="polite">
          {fase === 'inicio' && (
            <div className="pilha">
              <h3>5 desafios rápidos</h3>
              <p className="texto-suave" style={{ margin: 0 }}>
                Cada desafio pede um ângulo e uma informação: seno, cosseno, tangente ou radianos.
              </p>
              <Botao tamanho="grande" bloco onClick={comecar} className="botao--brilho">
                Começar
              </Botao>
            </div>
          )}

          {(fase === 'procurando' || fase === 'achou' || fase === 'resposta') && desafio && (
            <div className="pilha">
              <div className="linha linha--entre">
                <span className="etiqueta etiqueta--neutra">
                  Desafio {indice + 1} de {TOTAL}
                </span>
                <span className="numero texto-suave">{acertos} acertos</span>
              </div>
              <h3 className="pratica__pedido">
                Gire até <b className="numero">{desafio.graus}°</b> e leia {FUNCOES[desafio.funcao]}.
              </h3>

              {fase === 'procurando' && (
                <p className="pratica__status">
                  {Math.abs(graus - desafio.graus) < 1 ? 'Segure aí…' : 'Procurando… a janela está no lado direito.'}
                </p>
              )}

              {fase !== 'procurando' && (
                <>
                  <JanelaLeitura graus={desafio.graus} destacar={desafio.funcao} compacta />
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    Quanto vale {NOME_CURTO[desafio.funcao]} {desafio.graus}°?
                  </p>
                  <div className="pratica__opcoes">
                    {desafio.opcoes.map((op) => {
                      const estado =
                        fase === 'resposta'
                          ? op === desafio.correta
                            ? 'certa'
                            : op === escolha
                              ? 'errada'
                              : 'apagada'
                          : '';
                      return (
                        <button
                          key={op}
                          type="button"
                          className={`pratica__opcao numero ${estado}`}
                          onClick={() => responder(op)}
                          disabled={fase === 'resposta'}
                        >
                          {op}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {fase === 'resposta' && (
                <Botao tamanho="grande" bloco onClick={proximo} autoFocus>
                  {indice + 1 >= TOTAL ? 'Ver resultado' : 'Próximo desafio →'}
                </Botao>
              )}
            </div>
          )}

          {fase === 'fim' && (
            <div className="pilha texto-centro">
              <p className="pratica__placar numero">
                {acertos}/{TOTAL}
              </p>
              <h3>{acertos === TOTAL ? 'Perfeito! Vocês dominam a roleta.' : acertos >= 3 ? 'Muito bem!' : 'Bom começo!'}</h3>
              <p className="texto-suave" style={{ margin: 0 }}>
                {acertos >= 3 ? 'Agora é só entrar na sala e jogar.' : 'Repita mais uma vez para ganhar confiança.'}
              </p>
              <Botao tamanho="grande" bloco onClick={comecar}>
                Jogar de novo
              </Botao>
              <Botao variante="secundario" bloco para="/teste">
                Treinar com o quiz completo
              </Botao>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
