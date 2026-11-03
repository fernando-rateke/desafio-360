import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../comuns/Modal.jsx';
import Campo from '../comuns/Campo.jsx';
import Botao from '../comuns/Botao.jsx';
import Aviso from '../comuns/Aviso.jsx';
import { criarSala, CONFIG_PADRAO } from '../../servicos/salas.js';
import { useAutenticacao } from '../../ganchos/useAutenticacao.jsx';

/** Configurações da sala antes de criar: perguntas por grupo e tempo. */
export default function ModalCriarSala({ quiz, aoFechar }) {
  const { usuario } = useAutenticacao();
  const navegar = useNavigate();
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (quiz) {
      setConfig({ ...CONFIG_PADRAO, perguntasPorGrupo: Math.min(CONFIG_PADRAO.perguntasPorGrupo, quiz.perguntas.length) });
      setErro('');
    }
  }, [quiz]);

  if (!quiz) return null;
  const total = quiz.perguntas.length;
  const porGrupo = Number(config.perguntasPorGrupo) || 0;
  const maxGrupos = porGrupo > 0 ? Math.floor(total / porGrupo) : 0;
  const valido = porGrupo >= 1 && porGrupo <= total && config.tempoPorPergunta >= 5 && config.tempoPorPergunta <= 300;

  const criar = async () => {
    setCriando(true);
    setErro('');
    try {
      const codigo = await criarSala({ quiz, config, usuario });
      navegar(`/professor/sala/${codigo}`);
    } catch (e) {
      setErro(e.message || 'Não foi possível criar a sala.');
      setCriando(false);
    }
  };

  return (
    <Modal
      aberto
      titulo="Nova sala"
      aoFechar={aoFechar}
      acoes={
        <>
          <Botao variante="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={criar} disabled={!valido || criando}>
            {criando ? 'Criando…' : 'Criar sala'}
          </Botao>
        </>
      }
    >
      <div className="pilha">
        <p className="texto-suave" style={{ margin: 0 }}>
          Quiz: <strong style={{ color: 'var(--texto)' }}>{quiz.titulo}</strong> ({total} perguntas)
        </p>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="grade-2">
          <Campo
            rotulo="Perguntas por grupo"
            type="number"
            min={1}
            max={total}
            value={config.perguntasPorGrupo}
            onChange={(e) => setConfig((c) => ({ ...c, perguntasPorGrupo: e.target.value === '' ? '' : Number(e.target.value) }))}
          />
          <Campo
            rotulo="Tempo por pergunta (s)"
            type="number"
            min={5}
            max={300}
            value={config.tempoPorPergunta}
            onChange={(e) => setConfig((c) => ({ ...c, tempoPorPergunta: e.target.value === '' ? '' : Number(e.target.value) }))}
          />
        </div>
        {valido && (
          <Aviso tipo="info">
            <p>
              As perguntas não se repetem entre grupos: com {porGrupo} por grupo, até <strong>{maxGrupos}</strong>{' '}
              {maxGrupos === 1 ? 'grupo joga' : 'grupos jogam'} com todas as perguntas.
            </p>
          </Aviso>
        )}
      </div>
    </Modal>
  );
}
