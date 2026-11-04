import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import Modal from '../componentes/comuns/Modal.jsx';
import Carregando from '../componentes/comuns/Carregando.jsx';
import CodigoSala from '../componentes/sala/CodigoSala.jsx';
import QrCodeSala from '../componentes/sala/QrCodeSala.jsx';
import FilaGrupos from '../componentes/sala/FilaGrupos.jsx';
import Cronometro from '../componentes/jogo/Cronometro.jsx';
import Placar from '../componentes/jogo/Placar.jsx';
import Podio from '../componentes/jogo/Podio.jsx';
import AlternativasMultipla from '../componentes/jogo/AlternativasMultipla.jsx';
import AlternativasVF from '../componentes/jogo/AlternativasVF.jsx';
import { useAutenticacao } from '../ganchos/useAutenticacao.jsx';
import { useNoBanco } from '../ganchos/useNoBanco.js';
import { useCronometro } from '../ganchos/useCronometro.js';
import { useContagem } from '../ganchos/useContagem.js';
import { agoraServidor } from '../servicos/tempo.js';
import { caminhoSala, filaDeGrupos, rankingDeGrupos, removerGrupo, encerrarSala } from '../servicos/salas.js';
import {
  prepararSorteio,
  iniciarRodada,
  publicarPergunta,
  corrigirPergunta,
  mostrarPlacar,
  avancar,
  irParaPodio,
  voltarAoLobby,
  perguntasRestantes,
  perguntasDaSala,
} from '../servicos/partida.js';
import { TIPOS } from '../logica/perguntas.js';
import { mensagemErroBanco } from '../servicos/autenticacao.js';

/** Tempo extra (ms) antes de encerrar a pergunta por tempo, para respostas "no limite" chegarem. */
const MARGEM_REDE = 800;

export default function ControleSala() {
  const { codigo } = useParams();
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const { valor: sala, carregando, erro } = useNoBanco(caminhoSala(codigo));

  const [ocupado, setOcupado] = useState(false);
  const [falha, setFalha] = useState('');
  const [sorteioPendente, setSorteioPendente] = useState(null);
  const [confirmarEncerrar, setConfirmarEncerrar] = useState(false);
  const [grupoParaRemover, setGrupoParaRemover] = useState(null);

  // Referência sempre atualizada da sala (para timers)
  const salaRef = useRef(sala);
  salaRef.current = sala;

  /** Executa uma ação do host mostrando erro se falhar. */
  const executar = useCallback(async (acao) => {
    setOcupado(true);
    setFalha('');
    try {
      await acao();
    } catch (e) {
      console.error(e);
      setFalha(mensagemErroBanco(e) || 'Algo deu errado: ' + (e.message || e));
    } finally {
      setOcupado(false);
    }
  }, []);

  /* ---------------- Motor da partida (correção automática) ---------------- */
  const rodada = sala?.rodada;
  const ativa = sala?.perguntaAtiva;
  const respostaAtual =
    rodada && ativa ? sala?.respostas?.[rodada.grupoUid]?.[ativa.id] || null : null;
  const emPergunta = sala?.estado === 'rodada' && rodada?.fase === 'pergunta' && !!ativa?.inicioEm;
  const restante = useCronometro(emPergunta ? ativa.inicioEm : null, ativa?.tempo || 0, agoraServidor);
  const corrigida = useRef(null);

  // 1) O grupo respondeu → corrige
  useEffect(() => {
    if (!emPergunta || !respostaAtual || corrigida.current === ativa.id) return;
    corrigida.current = ativa.id;
    executar(() => corrigirPergunta(codigo, salaRef.current, respostaAtual));
  }, [emPergunta, respostaAtual, ativa?.id, codigo, executar]);

  // 2) Tempo esgotado → espera a margem de rede e corrige sem resposta
  useEffect(() => {
    if (!emPergunta || restante > 0 || corrigida.current === ativa.id) return undefined;
    const id = ativa.id;
    const t = setTimeout(() => {
      const atual = salaRef.current;
      if (corrigida.current === id || atual?.rodada?.fase !== 'pergunta' || atual?.perguntaAtiva?.id !== id) return;
      corrigida.current = id;
      const resposta = atual.respostas?.[atual.rodada.grupoUid]?.[id] || null;
      executar(() => corrigirPergunta(codigo, atual, resposta));
    }, MARGEM_REDE);
    return () => clearTimeout(t);
  }, [emPergunta, restante, ativa?.id, codigo, executar]);

  // Atalho: Enter/Espaço/→ acionam o botão principal no projetor
  useEffect(() => {
    const tecla = (e) => {
      if (e.target.closest?.('input, textarea, select, button, a')) return;
      if (['Enter', ' ', 'ArrowRight'].includes(e.key)) {
        const botao = document.querySelector('[data-acao-principal]');
        if (botao && !botao.disabled) {
          e.preventDefault();
          botao.click();
        }
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  /* ---------------- Dados derivados ---------------- */
  const fila = useMemo(() => filaDeGrupos(sala?.grupos), [sala?.grupos]);
  const aguardando = fila.filter((g) => !g.jogou && g.id !== rodada?.grupoUid);
  const jogaram = rankingDeGrupos(sala?.grupos).filter((g) => g.jogou);
  const ranking = rankingDeGrupos(sala?.grupos);
  const restantesNoBanco = sala ? perguntasRestantes(sala) : 0;
  const urlSala = `${window.location.origin}/sala/${codigo}`;

  /* ---------------- Ações ---------------- */
  const pedirInicioRodada = (grupo) => {
    const sorteio = prepararSorteio(salaRef.current);
    if (sorteio.esgotado) {
      setSorteioPendente({ grupo, ...sorteio });
      return;
    }
    executar(() => iniciarRodada(codigo, salaRef.current, grupo.id, sorteio.sorteadas));
  };

  const confirmarSorteioReduzido = () => {
    const { grupo, sorteadas } = sorteioPendente;
    setSorteioPendente(null);
    executar(() => iniciarRodada(codigo, salaRef.current, grupo.id, sorteadas));
  };

  /* ---------------- Renderização ---------------- */
  if (carregando) return <Carregando texto="Abrindo sala…" />;
  if (erro || !sala || sala.hostUid !== usuario.uid) {
    return (
      <>
        <Cabecalho logoPara="/professor" />
        <main className="pagina pagina--estreita pilha">
          <Aviso tipo="erro" titulo="Sala indisponível">
            <p>A sala {codigo} não existe ou pertence a outro professor.</p>
          </Aviso>
          <Botao para="/professor">Voltar ao painel</Botao>
        </main>
      </>
    );
  }

  const barra = (
    <header className="projetor-barra">
      <div className="projetor-barra__esq">
        <span className="projetor-barra__codigo numero">{codigo}</span>
        <span className="texto-suave projetor-barra__quiz">{sala.quizTitulo}</span>
      </div>
      <div className="projetor-barra__dir">
        <span className="texto-fraco so-computador">
          {sala.config.perguntasPorGrupo} {sala.config.perguntasPorGrupo === 1 ? 'pergunta' : 'perguntas'}/grupo · {sala.config.tempoPorPergunta} s · {restantesNoBanco} no banco
        </span>
        {sala.estado !== 'podio' && (jogaram.length > 0 || sala.estado === 'rodada') && (
          <Botao variante="secundario" tamanho="pequeno" onClick={() => setConfirmarEncerrar(true)}>
            Encerrar partida
          </Botao>
        )}
        <Botao variante="fantasma" tamanho="pequeno" para="/professor">
          Painel
        </Botao>
      </div>
    </header>
  );

  let conteudo;
  if (sala.estado === 'encerrada') {
    conteudo = (
      <div className="pagina pagina--estreita pilha texto-centro">
        <h1>Sala encerrada</h1>
        <Botao para="/professor">Voltar ao painel</Botao>
      </div>
    );
  } else if (sala.estado === 'podio') {
    conteudo = (
      <div className="pagina pilha">
        <Podio ranking={ranking} />
        <div className="linha" style={{ justifyContent: 'center' }}>
          <Botao
            variante="secundario"
            onClick={() =>
              executar(async () => {
                await encerrarSala(codigo, usuario.uid);
                navegar('/professor');
              })
            }
          >
            Fechar sala e voltar ao painel
          </Botao>
        </div>
      </div>
    );
  } else if (sala.estado === 'rodada' && rodada) {
    conteudo = (
      <TelaRodada
        sala={sala}
        restante={restante}
        ocupado={ocupado}
        aguardando={aguardando}
        ranking={ranking}
        aoMostrarPlacar={() => executar(() => mostrarPlacar(codigo))}
        aoAvancar={() => executar(() => avancar(codigo, salaRef.current))}
        aoPublicarPrimeira={() => executar(() => publicarPergunta(codigo, salaRef.current, 0))}
        aoProximoGrupo={() => executar(() => voltarAoLobby(codigo))}
        aoPodio={() => executar(() => irParaPodio(codigo, salaRef.current))}
      />
    );
  } else {
    conteudo = (
      <Lobby
        codigo={codigo}
        url={urlSala}
        aguardando={aguardando}
        jogaram={jogaram}
        restantesNoBanco={restantesNoBanco}
        config={sala.config}
        ocupado={ocupado}
        totalPerguntas={perguntasDaSala(sala).length}
        aoIniciar={pedirInicioRodada}
        aoRemover={setGrupoParaRemover}
        aoPodio={() => executar(() => irParaPodio(codigo, salaRef.current))}
      />
    );
  }

  return (
    <div className="projetor">
      {barra}
      {falha && (
        <div className="pagina" style={{ paddingBottom: 0 }}>
          <Aviso tipo="erro">{falha}</Aviso>
        </div>
      )}
      {conteudo}

      <Modal
        aberto={!!sorteioPendente}
        titulo={sorteioPendente?.disponiveis ? 'Faltam perguntas no banco' : 'Acabaram as perguntas'}
        aoFechar={() => setSorteioPendente(null)}
        acoes={
          <>
            <Botao variante="fantasma" onClick={() => setSorteioPendente(null)}>
              Cancelar
            </Botao>
            {sorteioPendente?.disponiveis > 0 && (
              <Botao variante="secundario" onClick={confirmarSorteioReduzido}>
                Jogar com {sorteioPendente.disponiveis}
              </Botao>
            )}
            <Botao
              onClick={() => {
                setSorteioPendente(null);
                executar(() => irParaPodio(codigo, salaRef.current));
              }}
            >
              Ir para o pódio
            </Botao>
          </>
        }
      >
        {sorteioPendente?.disponiveis ? (
          <p>
            Restam só <strong>{sorteioPendente.disponiveis}</strong> perguntas inéditas, e cada grupo deveria responder{' '}
            {sala.config.perguntasPorGrupo}. As perguntas nunca se repetem entre grupos. O que deseja fazer com{' '}
            <strong>{sorteioPendente.grupo.nome}</strong>?
          </p>
        ) : (
          <p>
            Todas as perguntas do quiz já foram usadas. Para não repetir perguntas, encerre a partida e vá para o pódio
            (ou crie uma nova sala com um quiz maior).
          </p>
        )}
      </Modal>

      <Modal
        aberto={confirmarEncerrar}
        titulo="Encerrar a partida?"
        aoFechar={() => setConfirmarEncerrar(false)}
        acoes={
          <>
            <Botao variante="fantasma" onClick={() => setConfirmarEncerrar(false)}>
              Continuar jogando
            </Botao>
            <Botao
              onClick={() => {
                setConfirmarEncerrar(false);
                executar(() => irParaPodio(codigo, salaRef.current));
              }}
            >
              Ir para o pódio
            </Botao>
          </>
        }
      >
        <p>Os grupos que ainda não jogaram ficam com 0 ponto. O pódio aparece em todas as telas.</p>
      </Modal>

      <Modal
        aberto={!!grupoParaRemover}
        titulo="Remover grupo?"
        aoFechar={() => setGrupoParaRemover(null)}
        acoes={
          <>
            <Botao variante="fantasma" onClick={() => setGrupoParaRemover(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              onClick={() => {
                const g = grupoParaRemover;
                setGrupoParaRemover(null);
                executar(() => removerGrupo(codigo, g.id));
              }}
            >
              Remover
            </Botao>
          </>
        }
      >
        <p>
          <strong>{grupoParaRemover?.nome}</strong> sairá da fila.
        </p>
      </Modal>
    </div>
  );
}

/* ====================================================================== */
/* Lobby: código grande, QR Code e fila                                    */
/* ====================================================================== */
function Lobby({ codigo, url, aguardando, jogaram, restantesNoBanco, config, ocupado, totalPerguntas, aoIniciar, aoRemover, aoPodio }) {
  const proximo = aguardando[0];
  const necessarias = aguardando.length * config.perguntasPorGrupo;
  const dominio = url.replace(/^https?:\/\//, '').replace(/\/sala\/.*/, '');

  return (
    <main className="lobby">
      <section className="lobby__entrada">
        <p className="lobby__instrucao">
          Entre em <strong>{dominio}/entrar</strong> com o código
        </p>
        <CodigoSala codigo={codigo} />
        <QrCodeSala url={url} tamanho={240} />
        <p className="texto-fraco">ou aponte a câmera para o QR Code</p>
      </section>

      <section className="lobby__painel cartao">
        <FilaGrupos aguardando={aguardando} jogaram={jogaram} aoRemover={aoRemover} />

        {restantesNoBanco === 0 && jogaram.length > 0 ? (
          <Aviso tipo="alerta" titulo="As perguntas acabaram">
            <p>Todas as {totalPerguntas} perguntas já foram usadas. Vá para o pódio.</p>
          </Aviso>
        ) : (
          necessarias > restantesNoBanco && (
            <Aviso tipo="alerta">
              <p>
                Restam {restantesNoBanco} perguntas inéditas para {aguardando.length} grupos ({necessarias} necessárias).
                Os últimos grupos podem ficar com menos perguntas.
              </p>
            </Aviso>
          )
        )}

        <div className="pilha pilha--pequena">
          <Botao
            tamanho="grande"
            bloco
            onClick={() => aoIniciar(proximo)}
            disabled={!proximo || ocupado}
            data-acao-principal
          >
            {proximo ? `Iniciar rodada: ${proximo.nome}` : 'Aguardando grupos…'}
          </Botao>
          {jogaram.length > 0 && (
            <Botao variante="secundario" bloco onClick={aoPodio} disabled={ocupado}>
              Ir para o pódio
            </Botao>
          )}
        </div>
      </section>
    </main>
  );
}

/* ====================================================================== */
/* Rodada: pergunta (enunciado oculto), resultado, placar, fim             */
/* ====================================================================== */
function TelaRodada({ sala, restante, ocupado, aguardando, ranking, aoMostrarPlacar, aoAvancar, aoPublicarPrimeira, aoProximoGrupo, aoPodio }) {
  const { rodada, perguntaAtiva: ativa, correcao } = sala;
  const [revelado, setRevelado] = useState(false);
  const pergunta = ativa ? perguntasDaSala(sala).find((p) => p.id === ativa.id) : null;

  // Esconde de novo a cada nova pergunta
  useEffect(() => setRevelado(false), [ativa?.id]);

  const respondeu = !!(ativa && sala.respostas?.[rodada.grupoUid]?.[ativa.id]);
  const ultima = rodada.numero >= rodada.total;

  const cabeca = (
    <div className="rodada__cabeca">
      <div>
        <span className="etiqueta etiqueta--teal">Grupo da vez</span>
        <h1 className="rodada__grupo">{rodada.grupoNome}</h1>
      </div>
      <div className="rodada__dados">
        <div>
          <span className="rodada__rotulo">Pergunta</span>
          <strong className="numero">
            {Math.max(1, rodada.numero)}/{rodada.total}
          </strong>
        </div>
        <div>
          <span className="rodada__rotulo">Pontuação parcial</span>
          <strong className="numero">{rodada.parcial || 0}</strong>
        </div>
      </div>
    </div>
  );

  if (rodada.fase === 'preparando') {
    return (
      <main className="rodada pagina">
        {cabeca}
        <div className="cartao pilha texto-centro">
          <p>Preparando a primeira pergunta…</p>
          <Botao onClick={aoPublicarPrimeira} disabled={ocupado} data-acao-principal>
            Publicar primeira pergunta
          </Botao>
        </div>
      </main>
    );
  }

  if (rodada.fase === 'pergunta' && ativa) {
    return (
      <main className="rodada pagina">
        {cabeca}
        <div className="rodada__palco">
          <Cronometro restante={restante} total={ativa.tempo} tamanho="grande" />
          <div className="rodada__status">
            <span className="etiqueta etiqueta--neutra">{TIPOS[ativa.tipo]}</span>
            <div className="enunciado-oculto">
              <span aria-hidden="true">🔒</span>
              <p>Enunciado oculto para os outros grupos não decorarem.</p>
            </div>
            <p className={`rodada__aguardando ${respondeu ? 'rodada__aguardando--ok' : ''}`}>
              {respondeu ? 'Resposta recebida! Corrigindo…' : restante > 0 ? `${rodada.grupoNome} está respondendo…` : 'Tempo esgotado!'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (rodada.fase === 'resultado' && correcao) {
    return (
      <main className="rodada pagina">
        {cabeca}
        <ResultadoProjetor correcao={correcao} />
        {revelado && pergunta && <Revelacao pergunta={pergunta} correcao={correcao} />}
        <div className="rodada__acoes">
          <Botao variante="secundario" tamanho="grande" onClick={() => setRevelado((r) => !r)}>
            {revelado ? 'Ocultar da tela' : 'Revelar na tela'}
          </Botao>
          <Botao tamanho="grande" onClick={aoMostrarPlacar} disabled={ocupado} data-acao-principal autoFocus>
            Ver placar →
          </Botao>
        </div>
      </main>
    );
  }

  if (rodada.fase === 'placar') {
    const linhas = ranking.map((g) => ({
      id: g.id,
      nome: g.nome,
      atual: g.pontuacao || 0,
      anterior: g.id === rodada.grupoUid ? rodada.pontuacaoAntes || 0 : g.pontuacao || 0,
      destaque: g.id === rodada.grupoUid,
    }));
    return (
      <main className="rodada pagina">
        {cabeca}
        {revelado && pergunta && correcao && <Revelacao pergunta={pergunta} correcao={correcao} />}
        <div className="rodada__placar">
          <Placar linhas={linhas} titulo="Placar" limite={10} />
        </div>
        <div className="rodada__acoes">
          {correcao && (
            <Botao variante="secundario" tamanho="grande" onClick={() => setRevelado((r) => !r)}>
              {revelado ? 'Ocultar da tela' : 'Revelar na tela'}
            </Botao>
          )}
          <Botao tamanho="grande" onClick={aoAvancar} disabled={ocupado} data-acao-principal autoFocus>
            {ultima ? 'Encerrar rodada' : 'Próxima pergunta →'}
          </Botao>
        </div>
      </main>
    );
  }

  if (rodada.fase === 'fim') {
    return (
      <FimRodada
        rodada={rodada}
        ranking={ranking}
        proximo={aguardando[0]}
        ocupado={ocupado}
        aoProximoGrupo={aoProximoGrupo}
        aoPodio={aoPodio}
      />
    );
  }

  return <Carregando texto="Sincronizando…" />;
}

function ResultadoProjetor({ correcao }) {
  const pontos = useContagem(correcao.pontos, { duracao: 1000, atraso: 300 });
  const titulo = correcao.acertou ? 'Acertou!' : correcao.esgotado ? 'Tempo esgotado' : 'Errou';
  return (
    <section className={`resultado-projetor surgir ${correcao.acertou ? 'resultado-projetor--acerto' : 'resultado-projetor--erro'}`}>
      <span className="resultado-projetor__icone" aria-hidden="true">
        {correcao.acertou ? '✓' : correcao.esgotado ? '⏱' : '✗'}
      </span>
      <h2 className="resultado-projetor__titulo">{titulo}</h2>
      <p className="resultado-projetor__pontos numero">+{pontos}</p>
      {correcao.acertou && <p className="texto-suave">respondeu com {correcao.tempoRestante} s sobrando</p>}
    </section>
  );
}

/** Enunciado + resposta correta + explicação, só quando o professor revela. */
function Revelacao({ pergunta, correcao }) {
  return (
    <section className="revelacao cartao surgir">
      <h2 className="revelacao__enunciado">{pergunta.enunciado}</h2>
      {pergunta.tipo === 'multipla' && (
        <AlternativasMultipla alternativas={pergunta.alternativas} escolhida={correcao.valor ?? null} aoEscolher={() => {}} bloqueado correta={pergunta.correta} />
      )}
      {pergunta.tipo === 'vf' && <AlternativasVF escolhida={correcao.valor ?? null} aoEscolher={() => {}} bloqueado correta={pergunta.correta} />}
      <dl className="feedback__detalhes">
        <div>
          <dt>Resposta do grupo</dt>
          <dd>{correcao.respostaDada}</dd>
        </div>
        <div>
          <dt>Resposta correta</dt>
          <dd>{correcao.respostaCorreta}</dd>
        </div>
      </dl>
      {correcao.explicacao && (
        <p className="feedback__explicacao">
          <strong>Por quê? </strong>
          {correcao.explicacao}
        </p>
      )}
    </section>
  );
}

function FimRodada({ rodada, ranking, proximo, ocupado, aoProximoGrupo, aoPodio }) {
  const parcial = useContagem(rodada.parcial || 0, { duracao: 1600, atraso: 200 });
  const linhas = ranking.map((g) => ({
    id: g.id,
    nome: g.nome,
    atual: g.pontuacao || 0,
    anterior: g.pontuacao || 0,
    destaque: g.id === rodada.grupoUid,
  }));
  return (
    <main className="rodada pagina">
      <section className="fim-rodada surgir">
        <span className="etiqueta etiqueta--teal">Fim da rodada</span>
        <h1 className="rodada__grupo">{rodada.grupoNome}</h1>
        <p className="fim-rodada__pontos numero">{parcial}</p>
        <p className="texto-suave">
          pontos · {rodada.acertos || 0} de {rodada.total} acertos
        </p>
      </section>
      <div className="rodada__placar">
        <Placar linhas={linhas} titulo="Classificação" animar={false} limite={10} />
      </div>
      <div className="rodada__acoes">
        {proximo ? (
          <>
            <Botao variante="secundario" tamanho="grande" onClick={aoPodio} disabled={ocupado}>
              Encerrar e ir para o pódio
            </Botao>
            <Botao tamanho="grande" onClick={aoProximoGrupo} disabled={ocupado} data-acao-principal autoFocus>
              Próximo grupo: {proximo.nome} →
            </Botao>
          </>
        ) : (
          <>
            <Botao variante="secundario" tamanho="grande" onClick={aoProximoGrupo} disabled={ocupado}>
              Voltar à fila
            </Botao>
            <Botao tamanho="grande" onClick={aoPodio} disabled={ocupado} data-acao-principal autoFocus>
              Todos jogaram — ver pódio 🏆
            </Botao>
          </>
        )}
      </div>
    </main>
  );
}
