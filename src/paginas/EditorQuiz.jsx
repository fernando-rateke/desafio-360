import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import Carregando from '../componentes/comuns/Carregando.jsx';
import Modal from '../componentes/comuns/Modal.jsx';
import ListaPerguntas from '../componentes/editor/ListaPerguntas.jsx';
import FormPergunta from '../componentes/editor/FormPergunta.jsx';
import { useAutenticacao } from '../ganchos/useAutenticacao.jsx';
import { carregarQuiz, salvarQuiz, duplicarQuiz } from '../servicos/quizzes.js';
import { novaPergunta, validarQuiz, validarPergunta } from '../logica/perguntas.js';
import { ID_QUIZ_OFICIAL } from '../dados/quizOficial.js';

export default function EditorQuiz() {
  const { id } = useParams();
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const somenteLeitura = id === ID_QUIZ_OFICIAL;

  const [quiz, setQuiz] = useState(null);
  const [selecionada, setSelecionada] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);
  const local = useLocation();
  // Ao salvar um quiz novo a página troca de endereço; o aviso vem junto
  const [mensagem, setMensagem] = useState(local.state?.salvo ? { tipo: 'sucesso', texto: 'Quiz salvo!' } : null);
  // Espelho de `alterado` lido pelo bloqueio de navegação (evita corrida logo após salvar)
  const alteradoRef = useRef(false);
  alteradoRef.current = alterado;

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      try {
        if (!id) {
          setQuiz({ titulo: '', perguntas: [novaPergunta('multipla')] });
        } else {
          const q = await carregarQuiz(usuario.uid, id);
          if (!ativo) return;
          if (!q) setErroCarregar('Quiz não encontrado.');
          else setQuiz(structuredClone(q));
        }
      } catch (e) {
        setErroCarregar('Não foi possível carregar o quiz: ' + e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    alteradoRef.current = false;
    setAlterado(false);
    setSelecionada(0);
    return () => {
      ativo = false;
    };
  }, [id, usuario.uid]);

  // Avisa antes de sair com alterações não salvas
  useEffect(() => {
    if (!alterado) return undefined;
    const antes = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', antes);
    return () => window.removeEventListener('beforeunload', antes);
  }, [alterado]);

  const bloqueio = useBlocker(
    ({ currentLocation, nextLocation }) => alteradoRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const mudarQuiz = useCallback((fn) => {
    setQuiz((q) => fn(q));
    setAlterado(true);
    setMensagem(null);
  }, []);

  const mudarPergunta = (indice, nova) =>
    mudarQuiz((q) => ({ ...q, perguntas: q.perguntas.map((p, i) => (i === indice ? nova : p)) }));

  const adicionar = (tipo = 'multipla') => {
    mudarQuiz((q) => ({ ...q, perguntas: [...q.perguntas, novaPergunta(tipo)] }));
    setSelecionada(quiz.perguntas.length);
  };

  const mover = (indice, direcao) => {
    const destino = indice + direcao;
    if (destino < 0 || destino >= quiz.perguntas.length) return;
    mudarQuiz((q) => {
      const lista = [...q.perguntas];
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
      return { ...q, perguntas: lista };
    });
    setSelecionada(destino);
  };

  const remover = (indice) => {
    mudarQuiz((q) => ({ ...q, perguntas: q.perguntas.filter((_, i) => i !== indice) }));
    setSelecionada((s) => Math.max(0, Math.min(s, quiz.perguntas.length - 2)));
  };

  const duplicarPergunta = (indice) => {
    mudarQuiz((q) => {
      const lista = [...q.perguntas];
      lista.splice(indice + 1, 0, { ...structuredClone(lista[indice]), id: novaPergunta().id });
      return { ...q, perguntas: lista };
    });
    setSelecionada(indice + 1);
  };

  const salvar = async () => {
    const validacao = validarQuiz(quiz);
    if (!validacao.valido) {
      setMostrarErros(true);
      const primeira = validacao.perguntas[0];
      if (primeira) setSelecionada(primeira.indice);
      setMensagem({
        tipo: 'erro',
        texto:
          validacao.titulo[0] ||
          `A pergunta ${primeira.indice + 1} tem pendências: ${primeira.erros.join(' ')}`,
      });
      return;
    }
    setSalvando(true);
    try {
      const novoId = await salvarQuiz(usuario.uid, quiz);
      alteradoRef.current = false;
      setAlterado(false);
      setMostrarErros(false);
      setMensagem({ tipo: 'sucesso', texto: 'Quiz salvo!' });
      if (!id) {
        navegar(`/professor/quiz/${novoId}`, { replace: true, state: { salvo: true } });
      }
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar: ' + e.message });
    } finally {
      setSalvando(false);
    }
  };

  const duplicarOficial = async () => {
    const novoId = await duplicarQuiz(usuario.uid, quiz);
    navegar(`/professor/quiz/${novoId}`);
  };

  if (carregando) return <Carregando texto="Abrindo quiz…" />;
  if (erroCarregar) {
    return (
      <>
        <Cabecalho logoPara="/professor" />
        <main className="pagina pagina--estreita pilha">
          <Aviso tipo="erro">{erroCarregar}</Aviso>
          <Botao para="/professor">Voltar ao painel</Botao>
        </main>
      </>
    );
  }

  const pergunta = quiz.perguntas[selecionada];
  const erros = quiz.perguntas.map((p) => validarPergunta(p));

  return (
    <>
      <Cabecalho logoPara="/professor">
        <Botao variante="fantasma" tamanho="pequeno" para="/professor">
          ← Painel
        </Botao>
      </Cabecalho>

      <div className="editor-barra">
        <div className="editor-barra__conteudo">
          <input
            className="entrada editor-barra__titulo"
            value={quiz.titulo}
            onChange={(e) => mudarQuiz((q) => ({ ...q, titulo: e.target.value }))}
            placeholder="Nome do quiz"
            aria-label="Nome do quiz"
            disabled={somenteLeitura}
            maxLength={80}
          />
          {somenteLeitura ? (
            <Botao onClick={duplicarOficial}>Duplicar para editar</Botao>
          ) : (
            <Botao onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : alterado ? 'Salvar alterações' : 'Salvo'}
            </Botao>
          )}
        </div>
      </div>

      <main className="pagina editor">
        {somenteLeitura && (
          <Aviso tipo="info" titulo="Quiz oficial — somente leitura">
            <p>Para mudar perguntas, use “Duplicar para editar”: uma cópia será criada em “Meus quizzes”.</p>
          </Aviso>
        )}
        {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}

        <div className="editor__grade">
          <ListaPerguntas
            perguntas={quiz.perguntas}
            selecionada={selecionada}
            aoSelecionar={setSelecionada}
            erros={mostrarErros ? erros : null}
            aoAdicionar={somenteLeitura ? null : adicionar}
          />

          {pergunta ? (
            <FormPergunta
              key={pergunta.id}
              pergunta={pergunta}
              indice={selecionada}
              total={quiz.perguntas.length}
              aoMudar={(nova) => mudarPergunta(selecionada, nova)}
              aoMover={(d) => mover(selecionada, d)}
              aoRemover={() => remover(selecionada)}
              aoDuplicar={() => duplicarPergunta(selecionada)}
              erros={mostrarErros ? erros[selecionada] : []}
              somenteLeitura={somenteLeitura}
            />
          ) : (
            <div className="cartao texto-centro pilha">
              <p className="texto-suave">Nenhuma pergunta ainda.</p>
              {!somenteLeitura && <Botao onClick={() => adicionar()}>+ Adicionar pergunta</Botao>}
            </div>
          )}
        </div>
      </main>

      <Modal
        aberto={bloqueio.state === 'blocked'}
        titulo="Sair sem salvar?"
        aoFechar={() => bloqueio.reset?.()}
        acoes={
          <>
            <Botao variante="fantasma" onClick={() => bloqueio.reset?.()}>
              Continuar editando
            </Botao>
            <Botao variante="perigo" onClick={() => bloqueio.proceed?.()}>
              Sair e descartar
            </Botao>
          </>
        }
      >
        <p>Você tem alterações que ainda não foram salvas.</p>
      </Modal>
    </>
  );
}
