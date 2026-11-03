import { TIPOS } from '../../logica/perguntas.js';

const ICONE_TIPO = { multipla: 'ABCD', vf: 'V/F', valor: 'x =' };

/** Lista lateral (computador) / faixa rolável (celular) de perguntas. */
export default function ListaPerguntas({ perguntas, selecionada, aoSelecionar, erros, aoAdicionar }) {
  return (
    <nav className="lista-perguntas" aria-label="Perguntas do quiz">
      <div className="lista-perguntas__topo">
        <strong>
          {perguntas.length} {perguntas.length === 1 ? 'pergunta' : 'perguntas'}
        </strong>
      </div>
      <ol className="lista-perguntas__itens">
        {perguntas.map((p, i) => {
          const comErro = erros && erros[i]?.length > 0;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`item-pergunta ${i === selecionada ? 'item-pergunta--ativa' : ''} ${comErro ? 'item-pergunta--erro' : ''}`}
                onClick={() => aoSelecionar(i)}
                aria-current={i === selecionada}
                title={TIPOS[p.tipo]}
              >
                <span className="item-pergunta__numero numero">{i + 1}</span>
                <span className="item-pergunta__texto">
                  <span className="item-pergunta__tipo numero">{ICONE_TIPO[p.tipo]}</span>
                  {p.enunciado || <em className="texto-fraco">Sem enunciado</em>}
                </span>
                {comErro && (
                  <span className="item-pergunta__alerta" aria-label="Pergunta com pendências">
                    !
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      {aoAdicionar && (
        <div className="lista-perguntas__adicionar">
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => aoAdicionar('multipla')}>
            + Múltipla
          </button>
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => aoAdicionar('vf')}>
            + V ou F
          </button>
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => aoAdicionar('valor')}>
            + Valor
          </button>
        </div>
      )}
    </nav>
  );
}
