import { TIPOS } from '../../logica/perguntas.js';

export default function CartaoPergunta({ pergunta, numero, total, children, oculto = false }) {
  return (
    <section className="cartao-pergunta surgir" key={pergunta?.id}>
      <div className="cartao-pergunta__topo">
        {numero && total && (
          <span className="etiqueta">
            Pergunta {numero} de {total}
          </span>
        )}
        {pergunta?.tipo && <span className="etiqueta etiqueta--neutra">{TIPOS[pergunta.tipo]}</span>}
      </div>
      {oculto ? (
        <p className="cartao-pergunta__enunciado cartao-pergunta__enunciado--oculto">
          Enunciado oculto para os outros grupos não decorarem.
        </p>
      ) : (
        <h2 className="cartao-pergunta__enunciado">{pergunta?.enunciado}</h2>
      )}
      {children}
    </section>
  );
}
