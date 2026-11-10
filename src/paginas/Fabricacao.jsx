import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import Carregando from '../componentes/comuns/Carregando.jsx';
import JanelaLeitura from '../componentes/tres/JanelaLeitura.jsx';
import Revelar from '../componentes/comuns/Revelar.jsx';
import { ANGULOS_NOTAVEIS } from '../logica/angulos.js';

const BASE = '/fabricacao';

const PASSOS_MONTAGEM = [
  {
    titulo: 'Corte as duas chapas',
    texto: 'Envie chapa-1 e chapa-2 para o laser. Grave primeiro (preto), depois marque (azul) e por último corte (vermelho), para as peças não saírem do lugar.',
  },
  {
    titulo: 'Lixe o disco',
    texto: 'Passe lixa 220 de leve nas duas faces do disco e na borda. Ele precisa girar solto entre a base e a máscara. Cera de vela ou parafina na face de baixo ajuda.',
  },
  {
    titulo: 'Cole a moldura na base',
    texto: 'Cola branca (PVA) em toda a face de baixo da moldura, alinhe os cantos com a base e prenda com grampos ou livros por 20 minutos. Limpe o excesso dentro do furo.',
  },
  {
    titulo: 'Cole o eixo no centro',
    texto: 'Cole o eixo de Ø 20 mm dentro do círculo marcado no centro da base. Confira que o disco encaixa e gira em volta dele antes de a cola secar.',
  },
  {
    titulo: 'Coloque o disco',
    texto: 'Encaixe o disco com a gravação para cima. Ele deve girar livre dentro do furo da moldura. Se raspar, lixe a borda.',
  },
  {
    titulo: 'Cole a máscara por cima',
    texto: 'Passe cola só em cima do eixo e na lingueta. Encaixe a lingueta no retângulo marcado à esquerda da moldura, com a janela apontando para a seta (0°). Espere secar sem girar o disco.',
  },
];

export default function Fabricacao() {
  const caixa = useRef(null);
  const cena = useRef(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [explodida, setExplodida] = useState(0.55);
  const [graus, setGraus] = useState(0);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/dados.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then(setDados)
      .catch(() => setErro('Não foi possível carregar o modelo. Rode "npm run fabricacao" para gerar os arquivos.'));
  }, []);

  useEffect(() => {
    if (!dados || !caixa.current) return undefined;
    let instancia = null;
    let cancelado = false;
    import('../tres/RoletaFisicaCena.js').then(({ RoletaFisicaCena }) => {
      if (cancelado) return;
      try {
        instancia = new RoletaFisicaCena(caixa.current, dados, { aoMudarAngulo: (g) => setGraus(g) });
        instancia.setExplosao(0.55);
        cena.current = instancia;
        setPronto(true);
      } catch {
        setErro('Este aparelho não conseguiu abrir o 3D. Os arquivos para download continuam abaixo.');
      }
    });
    return () => {
      cancelado = true;
      instancia?.dispose();
    };
  }, [dados]);

  useEffect(() => cena.current?.setExplosao(explodida), [explodida]);

  const girarAleatorio = () => {
    const outros = ANGULOS_NOTAVEIS.filter((a) => a.graus !== graus);
    cena.current?.setAngulo(outros[Math.floor(Math.random() * outros.length)].graus);
  };

  const P = dados?.parametros;
  const alturaTotal = P ? P.espessura * 3 : 9;

  return (
    <div className="fabricacao">
      <Cabecalho>
        <Link to="/tutorial" className="so-computador" style={{ marginRight: 8 }}>
          Tutorial
        </Link>
        <Botao variante="secundario" tamanho="pequeno" para="/">
          Início
        </Botao>
      </Cabecalho>

      <header className="fabricacao__abertura">
        <span className="etiqueta">Produto físico · corte a laser</span>
        <h1>
          A roleta de <span>MDF</span>, peça por peça
        </h1>
        <p className="texto-suave">
          Modelo 3D e arquivos prontos para a cortadora a laser. São 5 peças de MDF 3 mm, montadas só com cola. Não precisa de
          parafusos.
        </p>
      </header>

      <section className="fabricacao__palco-sec">
        <div className="fabricacao__palco">
          <div ref={caixa} className="fabricacao__canvas" />
          {!pronto && !erro && <Carregando texto="Montando o modelo 3D…" />}
          {erro && (
            <div className="fabricacao__erro">
              <Aviso tipo="alerta">{erro}</Aviso>
            </div>
          )}
          {pronto && (
            <>
              <div className="fabricacao__controles">
                <label className="fabricacao__deslizador">
                  <span>Montada</span>
                  <input type="range" min="0" max="1" step="0.01" value={explodida} onChange={(e) => setExplodida(Number(e.target.value))} aria-label="Explodir a montagem" />
                  <span>Explodida</span>
                </label>
                <div className="linha" style={{ gap: 8, justifyContent: 'center' }}>
                  <Botao tamanho="pequeno" onClick={girarAleatorio}>
                    ↻ Girar o disco
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => cena.current?.setVista('geral')}>
                    Perspectiva
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => cena.current?.setVista('topo')}>
                    De cima
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => cena.current?.setVista('lado')}>
                    De lado
                  </Botao>
                </div>
              </div>
              <JanelaLeitura graus={graus} compacta className="fabricacao__janela" />
              <span className="fabricacao__dica">Arraste para girar a câmera · role para aproximar</span>
            </>
          )}
        </div>
      </section>

      {P && (
        <section className="secao">
          <div className="fichas">
            <div>
              <strong className="numero">
                {P.lado} × {P.lado} × {alturaTotal}
              </strong>
              <span>mm (montada)</span>
            </div>
            <div>
              <strong className="numero">{P.espessura} mm</strong>
              <span>MDF cru</span>
            </div>
            <div>
              <strong className="numero">{dados.pecas.length}</strong>
              <span>peças</span>
            </div>
            <div>
              <strong className="numero">{dados.chapas.length}</strong>
              <span>
                chapas de {P.mesa.largura}×{P.mesa.altura}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Downloads ---------------- */}
      <section className="secao">
        <Revelar className="secao__cabeca">
          <span className="etiqueta etiqueta--teal">Arquivos</span>
          <h2 className="secao__titulo">
            Baixe e mande <span>para o laser</span>
          </h2>
          <p className="texto-suave secao__sub">
            As chapas já vêm organizadas para uma mesa de {P ? `${P.mesa.largura} × ${P.mesa.altura}` : '600 × 400'} mm. Se a
            sua mesa for menor, use os arquivos de cada peça separada.
          </p>
        </Revelar>

        <div className="downloads">
          <div className="cartao downloads__grupo">
            <h3>Chapas prontas (SVG)</h3>
            <p className="texto-suave">Abra no LightBurn, RDWorks, LaserGRBL ou Inkscape. Apague o retângulo verde (limite da mesa).</p>
            <div className="linha">
              {(dados?.chapas || [[], []]).map((_, i) => (
                <Botao key={i} tamanho="pequeno" para={`${BASE}/chapas/chapa-${i + 1}.svg`} download reloadDocument>
                  ⬇ Chapa {i + 1}
                </Botao>
              ))}
            </div>
          </div>
          <div className="cartao downloads__grupo">
            <h3>Modelo 3D (STL)</h3>
            <p className="texto-suave">Para ver no Windows (Visualizador 3D), no Tinkercad, no Fusion 360 ou para imprimir em 3D.</p>
            <div className="linha">
              <Botao tamanho="pequeno" variante="secundario" para={`${BASE}/3d/roleta-montada.stl`} download reloadDocument>
                ⬇ Montada
              </Botao>
              <Botao tamanho="pequeno" variante="secundario" para={`${BASE}/3d/roleta-explodida.stl`} download reloadDocument>
                ⬇ Explodida
              </Botao>
            </div>
          </div>
        </div>

        <div className="lista-pecas">
          {dados?.pecas.map((p, i) => (
            <Revelar as="article" key={p.id} atraso={i * 70} className="peca">
              <div className="peca__previa">
                <img src={`${BASE}/pecas/${p.arquivo}.svg`} alt={`Desenho da peça ${p.nome}`} loading="lazy" />
              </div>
              <div className="peca__info">
                <h3>
                  {i + 1}. {p.nome} <span className="texto-fraco">× {p.quantidade}</span>
                </h3>
                <p className="texto-fraco numero">
                  {p.largura} × {p.altura} mm
                </p>
                <p className="texto-suave">{p.descricao}</p>
                <div className="linha" style={{ gap: 8 }}>
                  <Botao tamanho="pequeno" variante="secundario" para={`${BASE}/pecas/${p.arquivo}.svg`} download reloadDocument>
                    SVG
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" para={`${BASE}/dxf/${p.arquivo}.dxf`} download reloadDocument>
                    DXF
                  </Botao>
                </div>
              </div>
            </Revelar>
          ))}
        </div>
      </section>

      {/* ---------------- Laser ---------------- */}
      <section className="secao">
        <Revelar className="cartao laser">
          <h2>Cores = operações do laser</h2>
          <ul className="laser__cores">
            <li>
              <span style={{ background: '#FF0000' }} /> <b>Vermelho — cortar.</b> Atravessa a chapa. Faça por último.
            </li>
            <li>
              <span style={{ background: '#0000FF' }} /> <b>Azul — marcar.</b> Linha fina, potência baixa (não atravessa).
            </li>
            <li>
              <span style={{ background: '#000000', border: '1px solid #555' }} /> <b>Preto — gravar.</b> Preenchimento (textos,
              QR Code). Faça primeiro.
            </li>
          </ul>
          <Aviso tipo="info" titulo="Teste antes numa sobra de MDF">
            <p>
              Potência e velocidade mudam de máquina para máquina. Faça um quadradinho de teste para cada cor e ajuste até o
              corte atravessar sem queimar demais. Meça a espessura real da chapa: se não for {P?.espessura ?? 3} mm, ajuste em{' '}
              <code>fabricacao/parametros.js</code> e gere de novo com <code>npm run fabricacao</code>.
            </p>
          </Aviso>
        </Revelar>
      </section>

      {/* ---------------- Montagem ---------------- */}
      <section className="secao">
        <Revelar className="secao__cabeca">
          <span className="etiqueta">Montagem</span>
          <h2 className="secao__titulo">
            Seis passos, <span>só com cola branca</span>
          </h2>
          <p className="texto-suave secao__sub">Material: 2 chapas de MDF 3 mm, cola branca (PVA), lixa 220 e grampos ou livros pesados.</p>
        </Revelar>
        <ol className="montagem">
          {PASSOS_MONTAGEM.map((p, i) => (
            <Revelar as="li" key={p.titulo} atraso={i * 60} className="montagem__passo">
              <span className="montagem__numero numero">{i + 1}</span>
              <div>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            </Revelar>
          ))}
        </ol>
      </section>

      <footer className="rodape">
        <span>Desafio 360 · projeto da roleta física</span>
        <span>
          <Link to="/tutorial">Como usar</Link> · <Link to="/">Início</Link>
        </span>
      </footer>
    </div>
  );
}
