import { useState } from 'react';
import Campo from '../comuns/Campo.jsx';
import Botao from '../comuns/Botao.jsx';
import Aviso from '../comuns/Aviso.jsx';
import { TIPOS, mudarTipo } from '../../logica/perguntas.js';
import { compararResposta } from '../../logica/normalizarResposta.js';

const LETRAS = ['A', 'B', 'C', 'D'];

export default function FormPergunta({
  pergunta,
  indice,
  total,
  aoMudar,
  aoMover,
  aoRemover,
  aoDuplicar,
  erros,
  somenteLeitura,
}) {
  const mudar = (campo, valor) => aoMudar({ ...pergunta, [campo]: valor });
  const travado = somenteLeitura;

  return (
    <section className="cartao form-pergunta" aria-label={`Pergunta ${indice + 1}`}>
      <div className="form-pergunta__topo">
        <h2 style={{ margin: 0 }}>Pergunta {indice + 1}</h2>
        {!travado && (
          <div className="linha" style={{ gap: 6 }}>
            <Botao variante="secundario" tamanho="pequeno" className="botao--icone" onClick={() => aoMover(-1)} disabled={indice === 0} aria-label="Mover para cima">
              ↑
            </Botao>
            <Botao variante="secundario" tamanho="pequeno" className="botao--icone" onClick={() => aoMover(1)} disabled={indice === total - 1} aria-label="Mover para baixo">
              ↓
            </Botao>
            <Botao variante="secundario" tamanho="pequeno" onClick={aoDuplicar}>
              Duplicar
            </Botao>
            <Botao variante="perigo" tamanho="pequeno" onClick={aoRemover}>
              Remover
            </Botao>
          </div>
        )}
      </div>

      {erros?.length > 0 && (
        <Aviso tipo="erro" titulo="Corrija antes de salvar:">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Aviso>
      )}

      <div className="grade-2">
        <Campo como="select" rotulo="Tipo" value={pergunta.tipo} onChange={(e) => aoMudar(mudarTipo(pergunta, e.target.value))} disabled={travado}>
          {Object.entries(TIPOS).map(([valor, nome]) => (
            <option key={valor} value={valor}>
              {nome}
            </option>
          ))}
        </Campo>
        <Campo
          rotulo="Tempo personalizado (s)"
          type="number"
          min={5}
          max={300}
          placeholder="Padrão da sala"
          dica="Deixe vazio para usar o tempo da sala."
          value={pergunta.tempo ?? ''}
          onChange={(e) => mudar('tempo', e.target.value === '' ? null : Number(e.target.value))}
          disabled={travado}
        />
      </div>

      <Campo
        como="textarea"
        rotulo="Enunciado"
        value={pergunta.enunciado}
        onChange={(e) => mudar('enunciado', e.target.value)}
        placeholder="Ex.: Qual é o valor de sen 30°?"
        disabled={travado}
        maxLength={300}
        rows={3}
      />

      {pergunta.tipo === 'multipla' && <EditorAlternativas pergunta={pergunta} mudar={mudar} travado={travado} />}
      {pergunta.tipo === 'vf' && <EditorVF pergunta={pergunta} mudar={mudar} travado={travado} />}
      {pergunta.tipo === 'valor' && <EditorRespostasAceitas pergunta={pergunta} mudar={mudar} travado={travado} />}

      <Campo
        como="textarea"
        rotulo="Explicação (aparece na correção)"
        value={pergunta.explicacao}
        onChange={(e) => mudar('explicacao', e.target.value)}
        placeholder="Ex.: 30° está no 1º quadrante; o seno é a coordenada y…"
        disabled={travado}
        maxLength={400}
        rows={2}
      />
    </section>
  );
}

function EditorAlternativas({ pergunta, mudar, travado }) {
  const mudarAlternativa = (i, texto) => {
    const lista = [...pergunta.alternativas];
    lista[i] = texto;
    mudar('alternativas', lista);
  };
  return (
    <fieldset className="editor-grupo">
      <legend className="campo__rotulo">Alternativas — marque a correta (gabarito)</legend>
      {pergunta.alternativas.map((alt, i) => (
        <div key={i} className={`editor-alternativa ${pergunta.correta === i ? 'editor-alternativa--correta' : ''}`}>
          <label className="editor-alternativa__radio">
            <input
              type="radio"
              name={`correta-${pergunta.id}`}
              checked={pergunta.correta === i}
              onChange={() => mudar('correta', i)}
              disabled={travado}
            />
            <span className={`alternativa__letra alternativa--${LETRAS[i].toLowerCase()}`}>{LETRAS[i]}</span>
            <span className="oculto-visualmente">Marcar {LETRAS[i]} como correta</span>
          </label>
          <input
            className="entrada"
            value={alt}
            onChange={(e) => mudarAlternativa(i, e.target.value)}
            placeholder={`Alternativa ${LETRAS[i]}`}
            aria-label={`Alternativa ${LETRAS[i]}`}
            disabled={travado}
            maxLength={80}
          />
        </div>
      ))}
    </fieldset>
  );
}

function EditorVF({ pergunta, mudar, travado }) {
  return (
    <fieldset className="editor-grupo">
      <legend className="campo__rotulo">A afirmação é… (gabarito)</legend>
      <div className="opcoes-chip">
        <button type="button" className="chip" aria-pressed={pergunta.correta === true} onClick={() => mudar('correta', true)} disabled={travado}>
          Verdadeira
        </button>
        <button type="button" className="chip" aria-pressed={pergunta.correta === false} onClick={() => mudar('correta', false)} disabled={travado}>
          Falsa
        </button>
      </div>
    </fieldset>
  );
}

function EditorRespostasAceitas({ pergunta, mudar, travado }) {
  const [teste, setTeste] = useState('');
  const lista = pergunta.respostasAceitas;
  const mudarItem = (i, texto) => mudar('respostasAceitas', lista.map((r, j) => (j === i ? texto : r)));
  const aceitas = lista.filter((r) => r.trim());
  const resultadoTeste = teste.trim() ? compararResposta(teste, aceitas) : null;

  return (
    <fieldset className="editor-grupo">
      <legend className="campo__rotulo">Respostas aceitas (gabarito)</legend>
      <p className="campo__dica" style={{ marginTop: 0 }}>
        A correção ignora espaços e maiúsculas, aceita vírgula ou ponto e entende √3/2 = raiz(3)/2 = raiz3/2 = 0,866. Para
        a tangente de 90°, cadastre “não existe”.
      </p>
      {lista.map((r, i) => (
        <div key={i} className="linha" style={{ flexWrap: 'nowrap' }}>
          <input
            className="entrada numero"
            value={r}
            onChange={(e) => mudarItem(i, e.target.value)}
            placeholder="Ex.: √3/2"
            aria-label={`Resposta aceita ${i + 1}`}
            disabled={travado}
            maxLength={40}
          />
          {!travado && lista.length > 1 && (
            <Botao
              variante="secundario"
              tamanho="pequeno"
              className="botao--icone"
              onClick={() => mudar('respostasAceitas', lista.filter((_, j) => j !== i))}
              aria-label="Remover resposta"
            >
              ✕
            </Botao>
          )}
        </div>
      ))}
      {!travado && (
        <Botao variante="secundario" tamanho="pequeno" onClick={() => mudar('respostasAceitas', [...lista, ''])} style={{ alignSelf: 'flex-start' }}>
          + Outra resposta aceita
        </Botao>
      )}

      <div className="editor-teste">
        <Campo rotulo="Testar uma resposta" value={teste} onChange={(e) => setTeste(e.target.value)} placeholder="Digite como um aluno digitaria" />
        {resultadoTeste !== null && (
          <span className={`editor-teste__resultado ${resultadoTeste ? 'ok' : 'erro'}`}>
            {resultadoTeste ? '✓ Seria aceita' : '✗ Seria recusada'}
          </span>
        )}
      </div>
    </fieldset>
  );
}
