import { useContagem } from '../../ganchos/useContagem.js';

/**
 * Resultado da pergunta para o grupo: acertou/errou, pontos e explicação.
 */
export default function Feedback({ acertou, esgotado, pontos = 0, respostaDada, respostaCorreta, explicacao, children }) {
  const pontosAnimados = useContagem(pontos, { duracao: 900, atraso: 250 });
  const titulo = acertou ? 'Acertou!' : esgotado ? 'Tempo esgotado' : 'Não foi dessa vez';

  return (
    <section className={`feedback surgir ${acertou ? 'feedback--acerto' : 'feedback--erro'}`} aria-live="polite">
      <div className="feedback__topo">
        <span className="feedback__icone" aria-hidden="true">
          {acertou ? '✓' : esgotado ? '⏱' : '✗'}
        </span>
        <div>
          <h2 className="feedback__titulo">{titulo}</h2>
          <p className="feedback__pontos numero">+{pontosAnimados} pontos</p>
        </div>
      </div>
      <dl className="feedback__detalhes">
        {respostaDada !== undefined && (
          <div>
            <dt>Sua resposta</dt>
            <dd>{respostaDada}</dd>
          </div>
        )}
        {respostaCorreta && (
          <div>
            <dt>Resposta correta</dt>
            <dd>{respostaCorreta}</dd>
          </div>
        )}
      </dl>
      {explicacao && (
        <p className="feedback__explicacao">
          <strong>Por quê? </strong>
          {explicacao}
        </p>
      )}
      {children}
    </section>
  );
}
