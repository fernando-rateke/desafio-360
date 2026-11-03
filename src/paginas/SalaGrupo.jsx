import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, set, serverTimestamp } from 'firebase/database';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import Carregando from '../componentes/comuns/Carregando.jsx';
import AvisoFirebase from '../componentes/comuns/AvisoFirebase.jsx';
import Cronometro from '../componentes/jogo/Cronometro.jsx';
import CartaoPergunta from '../componentes/jogo/CartaoPergunta.jsx';
import RespostaPergunta from '../componentes/jogo/RespostaPergunta.jsx';
import Feedback from '../componentes/jogo/Feedback.jsx';
import Placar from '../componentes/jogo/Placar.jsx';
import Podio from '../componentes/jogo/Podio.jsx';
import TelaEspera from '../componentes/jogo/TelaEspera.jsx';
import { db, firebaseConfigurado } from '../servicos/firebase.js';
import { garantirLoginGrupo, mensagemErroAuth } from '../servicos/autenticacao.js';
import { caminhoSala, entrarNaSala, filaDeGrupos, rankingDeGrupos } from '../servicos/salas.js';
import { agoraServidor } from '../servicos/tempo.js';
import { useNoBanco } from '../ganchos/useNoBanco.js';
import { useCronometro } from '../ganchos/useCronometro.js';
import { useContagem } from '../ganchos/useContagem.js';
import { limparCodigo } from '../logica/gerarCodigo.js';

const chaveLocal = (codigo) => `desafio360:sala:${codigo}`;

function lerLocal(codigo) {
  try {
    return localStorage.getItem(chaveLocal(codigo));
  } catch {
    return null;
  }
}

function gravarLocal(codigo, valor) {
  try {
    if (valor) localStorage.setItem(chaveLocal(codigo), valor);
    else localStorage.removeItem(chaveLocal(codigo));
  } catch {
    /* navegação privada: tudo bem */
  }
}

export default function SalaGrupo() {
  const codigo = limparCodigo(useParams().codigo);
  const [uid, setUid] = useState(null);
  const [erroLogin, setErroLogin] = useState('');

  useEffect(() => {
    if (!firebaseConfigurado) return;
    garantirLoginGrupo()
      .then((u) => setUid(u.uid))
      .catch((e) => setErroLogin(mensagemErroAuth(e)));
  }, []);

  if (!firebaseConfigurado) return <AvisoFirebase />;
  if (erroLogin) {
    return (
      <main className="pagina pagina--estreita pagina--centro">
        <Aviso tipo="erro" titulo="Não foi possível entrar">
          <p>{erroLogin}</p>
        </Aviso>
      </main>
    );
  }
  if (!uid) return <Carregando texto="Conectando…" />;
  return <Sala codigo={codigo} uid={uid} />;
}

function Sala({ codigo, uid }) {
  const estado = useNoBanco(caminhoSala(codigo, 'estado'));
  const grupos = useNoBanco(caminhoSala(codigo, 'grupos'));
  const rodadaNo = useNoBanco(caminhoSala(codigo, 'rodada'));
  const titulo = useNoBanco(caminhoSala(codigo, 'quizTitulo'));

  const rodada = rodadaNo.valor;
  const minhaVez = estado.valor === 'rodada' && rodada?.grupoUid === uid;
  // Só o grupo da vez pode ler a pergunta e a correção (regras do banco)
  const ativa = useNoBanco(minhaVez ? caminhoSala(codigo, 'perguntaAtiva') : null);
  const correcao = useNoBanco(minhaVez ? caminhoSala(codigo, 'correcao') : null);

  const eu = grupos.valor?.[uid];
  const [jaEntrou, setJaEntrou] = useState(() => lerLocal(codigo));

  if (estado.carregando || grupos.carregando) return <Carregando texto="Abrindo sala…" />;

  if (!estado.valor || estado.valor === 'encerrada') {
    return (
      <Moldura codigo={codigo}>
        <TelaEspera titulo={estado.valor === 'encerrada' ? 'Esta sala foi encerrada' : `Sala ${codigo} não encontrada`}>
          <p className="texto-suave">Confira o código com o professor.</p>
          <Botao para="/entrar">Digitar outro código</Botao>
        </TelaEspera>
      </Moldura>
    );
  }

  const ranking = rankingDeGrupos(grupos.valor);

  if (estado.valor === 'podio') {
    return (
      <Moldura codigo={codigo} nome={eu?.nome}>
        <div className="area-jogo">
          <Podio ranking={ranking} destaqueId={uid} />
          {eu && <PosicaoFinal ranking={ranking} uid={uid} />}
        </div>
      </Moldura>
    );
  }

  if (!eu) {
    return (
      <Moldura codigo={codigo}>
        <FormEntrada
          codigo={codigo}
          uid={uid}
          titulo={titulo.valor}
          grupos={grupos.valor}
          removido={!!jaEntrou}
          aoEntrar={(nome) => {
            gravarLocal(codigo, nome);
            setJaEntrou(nome);
          }}
        />
      </Moldura>
    );
  }

  if (minhaVez) {
    return (
      <MinhaRodada
        codigo={codigo}
        uid={uid}
        eu={eu}
        rodada={rodada}
        ativa={ativa.valor}
        correcao={correcao.valor}
        ranking={ranking}
      />
    );
  }

  return (
    <Moldura codigo={codigo} nome={eu.nome} pontos={eu.pontuacao}>
      <Espera uid={uid} eu={eu} estado={estado.valor} rodada={rodada} grupos={grupos.valor} ranking={ranking} />
    </Moldura>
  );
}

/* ---------------------------------------------------------------------- */

function Moldura({ codigo, nome, pontos, children }) {
  return (
    <>
      <Cabecalho>
        {nome && (
          <span className="grupo-chip">
            <strong>{nome}</strong>
            {pontos !== undefined && <span className="numero">{pontos} pts</span>}
          </span>
        )}
        <span className="etiqueta etiqueta--neutra numero">Sala {codigo}</span>
      </Cabecalho>
      <main className="pagina pagina--media">{children}</main>
    </>
  );
}

function FormEntrada({ codigo, uid, titulo, grupos, removido, aoEntrar }) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    const limpo = nome.trim().replace(/\s+/g, ' ');
    if (limpo.length < 2) return setErro('O nome precisa ter pelo menos 2 letras.');
    const repetido = Object.entries(grupos || {}).some(([id, g]) => id !== uid && g.nome?.toLowerCase() === limpo.toLowerCase());
    if (repetido) return setErro('Já existe um grupo com esse nome. Escolham outro.');
    setEnviando(true);
    try {
      await entrarNaSala(codigo, uid, limpo);
      aoEntrar(limpo);
    } catch {
      setErro('Não foi possível entrar. A partida pode já ter terminado.');
      setEnviando(false);
    }
  };

  return (
    <form className="pilha surgir entrar" onSubmit={enviar} style={{ maxWidth: 480, margin: '0 auto' }}>
      {titulo && <span className="etiqueta" style={{ alignSelf: 'center' }}>{titulo}</span>}
      <h1 className="texto-centro">Nome do grupo</h1>
      {removido && (
        <Aviso tipo="alerta">
          <p>Vocês não estão mais na fila desta sala. Digitem o nome para entrar de novo.</p>
        </Aviso>
      )}
      <label className="oculto-visualmente" htmlFor="nome-grupo">
        Nome do grupo
      </label>
      <input
        id="nome-grupo"
        className="entrada entrar__nome"
        value={nome}
        onChange={(e) => {
          setNome(e.target.value);
          setErro('');
        }}
        placeholder="Ex.: Os Radianos"
        maxLength={24}
        autoComplete="off"
        autoFocus
      />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao type="submit" tamanho="grande" bloco disabled={enviando || nome.trim().length < 2}>
        {enviando ? 'Entrando…' : 'Entrar na fila'}
      </Botao>
    </form>
  );
}

function Espera({ uid, eu, estado, rodada, grupos, ranking }) {
  const fila = filaDeGrupos(grupos).filter((g) => !g.jogou && g.id !== rodada?.grupoUid);
  const posicao = fila.findIndex((g) => g.id === uid);
  const jogando = estado === 'rodada' && rodada;
  const jogaram = ranking.filter((g) => g.jogou);

  let titulo;
  let texto;
  if (eu.jogou) {
    const lugar = jogaram.findIndex((g) => g.id === uid) + 1;
    titulo = 'Rodada concluída!';
    texto = `Vocês fizeram ${eu.pontuacao || 0} pontos e estão em ${lugar}º lugar até agora. Aguardem o pódio.`;
  } else if (posicao === 0) {
    titulo = jogando ? 'Vocês são os próximos!' : 'É a vez de vocês!';
    texto = jogando ? 'Preparem-se: quando o grupo atual terminar, peguem a roleta.' : 'Peguem a roleta e aguardem o professor iniciar a rodada.';
  } else {
    titulo = `Vocês são o ${posicao + 1}º grupo na fila`;
    texto = 'Aguardem a vez de vocês. Enquanto isso, nada de espiar a roleta!';
  }

  return (
    <div className="pilha">
      <TelaEspera titulo={titulo}>
        <p className="texto-suave" style={{ maxWidth: 440 }}>
          {texto}
        </p>
        {jogando && (
          <p className="espera__agora">
            Jogando agora: <strong>{rodada.grupoNome}</strong>
            {rodada.numero > 0 && (
              <span className="numero">
                {' '}
                · pergunta {rodada.numero} de {rodada.total}
              </span>
            )}
          </p>
        )}
      </TelaEspera>
      {jogaram.length > 0 && (
        <Placar
          titulo="Classificação parcial"
          animar={false}
          linhas={jogaram.map((g) => ({ id: g.id, nome: g.nome, atual: g.pontuacao || 0, anterior: g.pontuacao || 0, destaque: g.id === uid }))}
        />
      )}
    </div>
  );
}

function PosicaoFinal({ ranking, uid }) {
  const lugar = ranking.findIndex((g) => g.id === uid) + 1;
  if (lugar === 0) return null;
  return (
    <p className="texto-centro texto-suave" style={{ marginTop: 16 }}>
      Vocês terminaram em <strong style={{ color: 'var(--ambar-claro)' }}>{lugar}º lugar</strong>. Parabéns pela partida!
    </p>
  );
}

/* ---------------------------------------------------------------------- */
/* A rodada do grupo: pergunta → resultado → placar → próxima              */
/* ---------------------------------------------------------------------- */
function MinhaRodada({ codigo, uid, eu, rodada, ativa, correcao, ranking }) {
  const [enviadas, setEnviadas] = useState({});
  const [falhaEnvio, setFalhaEnvio] = useState({});
  const fase = rodada.fase;
  const emPergunta = fase === 'pergunta' && ativa?.inicioEm;
  const restante = useCronometro(emPergunta ? ativa.inicioEm : null, ativa?.tempo || 0, agoraServidor);
  const enviada = ativa ? enviadas[ativa.id] : undefined;
  const correcaoAtual = correcao;

  const responder = useCallback(
    async (valor) => {
      if (!ativa) return;
      setEnviadas((e) => ({ ...e, [ativa.id]: valor }));
      try {
        await set(ref(db, caminhoSala(codigo, `respostas/${uid}/${ativa.id}`)), {
          valor,
          respondidoEm: serverTimestamp(),
        });
      } catch {
        setFalhaEnvio((f) => ({ ...f, [ativa.id]: true }));
      }
    },
    [ativa, codigo, uid],
  );

  const barra = (
    <div className="barra-jogo">
      <div className="barra-jogo__info">
        <span className="barra-jogo__grupo">{eu.nome}</span>
        <span className="barra-jogo__pontos">{rodada.parcial || 0} pts nesta rodada</span>
      </div>
      {fase === 'pergunta' && ativa && (
        <div className="so-celular">
          <Cronometro restante={restante} total={ativa.tempo} tamanho="compacto" />
        </div>
      )}
      <span className="etiqueta etiqueta--neutra numero">
        {Math.max(1, rodada.numero)}/{rodada.total}
      </span>
    </div>
  );

  if (fase === 'preparando' || (fase === 'pergunta' && !ativa)) {
    return (
      <>
        {barra}
        <main className="area-jogo">
          <TelaEspera titulo="É a vez de vocês!">
            <p className="texto-suave">Peguem a roleta. A primeira pergunta já vai aparecer…</p>
          </TelaEspera>
        </main>
      </>
    );
  }

  if (fase === 'pergunta') {
    const esgotado = restante <= 0;
    const bloqueado = esgotado || enviada !== undefined;
    return (
      <>
        {barra}
        <main className="area-jogo">
          <div className="area-jogo__cabeca">
            <CartaoPergunta pergunta={ativa} numero={ativa.numero} total={ativa.total} />
            <div className="so-computador">
              <Cronometro restante={restante} total={ativa.tempo} tamanho="lateral" />
            </div>
          </div>
          <RespostaPergunta key={ativa.id} pergunta={ativa} aoResponder={responder} bloqueado={bloqueado} valorEnviado={enviada} />
          {falhaEnvio[ativa.id] ? (
            <Aviso tipo="erro">
              <p>A resposta não foi aceita: o tempo já tinha acabado.</p>
            </Aviso>
          ) : enviada !== undefined ? (
            <div className="enviada surgir">
              <span className="enviada__icone" aria-hidden="true">
                📨
              </span>
              <strong>Resposta enviada!</strong>
              <p className="texto-suave" style={{ margin: 0 }}>
                Olhem para o projetor…
              </p>
            </div>
          ) : (
            esgotado && (
              <div className="enviada surgir">
                <span className="enviada__icone" aria-hidden="true">
                  ⏱
                </span>
                <strong>Tempo esgotado!</strong>
              </div>
            )
          )}
        </main>
      </>
    );
  }

  if (fase === 'resultado' && correcaoAtual) {
    return (
      <>
        {barra}
        <main className="area-jogo">
          {ativa && ativa.tipo !== 'valor' && (
            <CartaoPergunta pergunta={ativa} numero={ativa.numero} total={ativa.total}>
              <div style={{ marginTop: 16 }}>
                <RespostaPergunta
                  key={`${ativa.id}-corrigida`}
                  pergunta={ativa}
                  aoResponder={() => {}}
                  bloqueado
                  valorEnviado={correcaoAtual.valor}
                  correta={correcaoAtual.correta}
                />
              </div>
            </CartaoPergunta>
          )}
          <Feedback
            acertou={correcaoAtual.acertou}
            esgotado={correcaoAtual.esgotado}
            pontos={correcaoAtual.pontos}
            respostaDada={correcaoAtual.respostaDada}
            respostaCorreta={correcaoAtual.respostaCorreta}
            explicacao={correcaoAtual.explicacao}
          />
          <p className="texto-centro texto-fraco">Aguardem o professor mostrar o placar.</p>
        </main>
      </>
    );
  }

  if (fase === 'placar') {
    const linhas = ranking.map((g) => ({
      id: g.id,
      nome: g.nome,
      atual: g.pontuacao || 0,
      anterior: g.id === uid ? rodada.pontuacaoAntes || 0 : g.pontuacao || 0,
      destaque: g.id === uid,
    }));
    return (
      <>
        {barra}
        <main className="area-jogo">
          <Placar linhas={linhas} titulo="Placar" limite={8} />
          <p className="texto-centro texto-fraco">
            {rodada.numero >= rodada.total ? 'Essa foi a última pergunta!' : 'Preparem a roleta para a próxima pergunta.'}
          </p>
        </main>
      </>
    );
  }

  if (fase === 'fim') {
    return (
      <>
        {barra}
        <main className="area-jogo">
          <FimMinhaRodada rodada={rodada} />
        </main>
      </>
    );
  }

  return <Carregando texto="Sincronizando…" />;
}

function FimMinhaRodada({ rodada }) {
  const pontos = useContagem(rodada.parcial || 0, { duracao: 1500 });
  const mensagem = useMemo(() => {
    const taxa = rodada.total ? (rodada.acertos || 0) / rodada.total : 0;
    if (taxa === 1) return 'Gabaritaram!';
    if (taxa >= 0.6) return 'Mandaram bem!';
    return 'Rodada concluída!';
  }, [rodada]);
  return (
    <TelaEspera titulo={mensagem}>
      <p className="fim-rodada__pontos numero">{pontos}</p>
      <p className="texto-suave">
        pontos · {rodada.acertos || 0} de {rodada.total} acertos
      </p>
      <Aviso tipo="info">
        <p>Passem a roleta para o próximo grupo. 🔄</p>
      </Aviso>
    </TelaEspera>
  );
}
