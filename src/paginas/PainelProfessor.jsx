import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import Modal from '../componentes/comuns/Modal.jsx';
import Campo from '../componentes/comuns/Campo.jsx';
import Carregando from '../componentes/comuns/Carregando.jsx';
import ModalCriarSala from '../componentes/sala/ModalCriarSala.jsx';
import { useAutenticacao } from '../ganchos/useAutenticacao.jsx';
import { useNoBanco } from '../ganchos/useNoBanco.js';
import { sair, mensagemErroBanco } from '../servicos/autenticacao.js';
import { duplicarQuiz, excluirQuiz, renomearQuiz } from '../servicos/quizzes.js';
import { normalizarQuizDoBanco } from '../servicos/utilidades.js';
import { quizOficial } from '../dados/quizOficial.js';

function contarTipos(perguntas) {
  const c = { multipla: 0, vf: 0, valor: 0 };
  perguntas.forEach((p) => c[p.tipo]++);
  return c;
}

function formatarData(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PainelProfessor() {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const { valor: brutos, carregando, erro } = useNoBanco(`quizzes/${usuario.uid}`);
  const { valor: salasAbertas } = useNoBanco(`usuarios/${usuario.uid}/salas`);

  const [quizParaSala, setQuizParaSala] = useState(null);
  const [renomeando, setRenomeando] = useState(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [excluindo, setExcluindo] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const quizzes = useMemo(
    () =>
      Object.entries(brutos || {})
        .map(([id, v]) => normalizarQuizDoBanco(id, v))
        .sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0)),
    [brutos],
  );

  const salas = Object.entries(salasAbertas || {}).sort((a, b) => (b[1].criadaEm || 0) - (a[1].criadaEm || 0));

  const duplicar = async (quiz) => {
    setOcupado(true);
    try {
      const id = await duplicarQuiz(usuario.uid, quiz);
      navegar(`/professor/quiz/${id}`);
    } catch (e) {
      setMensagem('Não foi possível duplicar: ' + e.message);
    } finally {
      setOcupado(false);
    }
  };

  const confirmarRenomear = async () => {
    if (!novoTitulo.trim()) return;
    await renomearQuiz(usuario.uid, renomeando.id, novoTitulo);
    setRenomeando(null);
  };

  const confirmarExcluir = async () => {
    await excluirQuiz(usuario.uid, excluindo.id);
    setExcluindo(null);
  };

  const oficialTipos = contarTipos(quizOficial.perguntas);

  return (
    <>
      <Cabecalho logoPara="/professor">
        <span className="texto-suave so-computador">Olá, {usuario.displayName || usuario.email}</span>
        <Botao variante="secundario" tamanho="pequeno" onClick={() => sair()}>
          Sair
        </Botao>
      </Cabecalho>

      <main className="pagina pilha" style={{ gap: 28 }}>
        {mensagem && <Aviso tipo="erro">{mensagem}</Aviso>}

        {salas.length > 0 && (
          <section className="pilha pilha--pequena">
            <h2>Salas abertas</h2>
            <div className="salas-abertas">
              {salas.map(([codigo, s]) => (
                <Botao key={codigo} variante="secundario" para={`/professor/sala/${codigo}`} className="sala-aberta">
                  <span className="numero sala-aberta__codigo">{codigo}</span>
                  <span className="texto-suave">{s.quizTitulo}</span>
                  <span aria-hidden="true">→</span>
                </Botao>
              ))}
            </div>
          </section>
        )}

        <section className="pilha pilha--pequena">
          <h2>Quiz oficial do site</h2>
          <article className="cartao cartao-quiz cartao-quiz--oficial">
            <div className="cartao-quiz__info">
              <span className="etiqueta">Oficial · somente leitura</span>
              <h3>{quizOficial.titulo}</h3>
              <p className="texto-suave">{quizOficial.descricao}</p>
              <p className="texto-fraco">
                {quizOficial.perguntas.length} perguntas · {oficialTipos.multipla} múltipla escolha · {oficialTipos.vf} V ou F ·{' '}
                {oficialTipos.valor} digitar o valor
              </p>
            </div>
            <div className="cartao-quiz__acoes">
              <Botao onClick={() => setQuizParaSala(quizOficial)}>Criar sala</Botao>
              <Botao variante="secundario" para="/professor/quiz/oficial">
                Ver perguntas
              </Botao>
              <Botao variante="secundario" onClick={() => duplicar(quizOficial)} disabled={ocupado}>
                Duplicar para editar
              </Botao>
            </div>
          </article>
        </section>

        <section className="pilha pilha--pequena">
          <div className="linha linha--entre">
            <h2 style={{ margin: 0 }}>Meus quizzes</h2>
            <Botao para="/professor/quiz/novo">+ Novo quiz</Botao>
          </div>

          {erro && <Aviso tipo="erro">Não foi possível carregar seus quizzes: {mensagemErroBanco(erro) || erro.message}</Aviso>}
          {carregando ? (
            <Carregando texto="Carregando quizzes…" />
          ) : quizzes.length === 0 ? (
            <div className="cartao texto-centro pilha pilha--pequena">
              <p className="texto-suave" style={{ margin: 0 }}>
                Você ainda não tem quizzes. Crie um do zero ou duplique o oficial para adaptar.
              </p>
            </div>
          ) : (
            <div className="grade-quizzes">
              {quizzes.map((q) => (
                <article key={q.id} className="cartao cartao-quiz">
                  <div className="cartao-quiz__info">
                    <h3>{q.titulo}</h3>
                    <p className="texto-fraco">
                      {q.perguntas.length} {q.perguntas.length === 1 ? 'pergunta' : 'perguntas'}
                      {q.atualizadoEm ? ` · atualizado em ${formatarData(q.atualizadoEm)}` : ''}
                    </p>
                  </div>
                  <div className="cartao-quiz__acoes">
                    <Botao tamanho="pequeno" onClick={() => setQuizParaSala(q)} disabled={q.perguntas.length === 0}>
                      Criar sala
                    </Botao>
                    <Botao tamanho="pequeno" variante="secundario" para={`/professor/quiz/${q.id}`}>
                      Editar
                    </Botao>
                    <Botao
                      tamanho="pequeno"
                      variante="secundario"
                      onClick={() => {
                        setRenomeando(q);
                        setNovoTitulo(q.titulo);
                      }}
                    >
                      Renomear
                    </Botao>
                    <Botao tamanho="pequeno" variante="secundario" onClick={() => duplicar(q)} disabled={ocupado}>
                      Duplicar
                    </Botao>
                    <Botao tamanho="pequeno" variante="perigo" onClick={() => setExcluindo(q)}>
                      Excluir
                    </Botao>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <ModalCriarSala quiz={quizParaSala} aoFechar={() => setQuizParaSala(null)} />

      <Modal
        aberto={!!renomeando}
        titulo="Renomear quiz"
        aoFechar={() => setRenomeando(null)}
        acoes={
          <>
            <Botao variante="fantasma" onClick={() => setRenomeando(null)}>
              Cancelar
            </Botao>
            <Botao onClick={confirmarRenomear} disabled={!novoTitulo.trim()}>
              Salvar
            </Botao>
          </>
        }
      >
        <Campo rotulo="Nome do quiz" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} autoFocus maxLength={80} />
      </Modal>

      <Modal
        aberto={!!excluindo}
        titulo="Excluir quiz?"
        aoFechar={() => setExcluindo(null)}
        acoes={
          <>
            <Botao variante="fantasma" onClick={() => setExcluindo(null)}>
              Cancelar
            </Botao>
            <Botao variante="perigo" onClick={confirmarExcluir}>
              Excluir para sempre
            </Botao>
          </>
        }
      >
        <p>
          O quiz <strong>{excluindo?.titulo}</strong> e suas {excluindo?.perguntas.length} perguntas serão apagados. Isso não
          pode ser desfeito.
        </p>
      </Modal>
    </>
  );
}
