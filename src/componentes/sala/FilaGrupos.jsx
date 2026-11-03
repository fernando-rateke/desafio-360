/**
 * Fila de grupos no painel do professor.
 * `aguardando`: grupos que ainda não jogaram (em ordem); `jogaram`: já jogaram.
 */
export default function FilaGrupos({ aguardando, jogaram, aoRemover, grupoAtualId }) {
  return (
    <div className="fila">
      <h3 className="fila__titulo">
        Fila <span className="etiqueta etiqueta--neutra">{aguardando.length}</span>
      </h3>
      {aguardando.length === 0 ? (
        <p className="texto-fraco">Nenhum grupo esperando. Peça para os grupos entrarem com o código.</p>
      ) : (
        <ol className="fila__lista">
          {aguardando.map((g, i) => (
            <li key={g.id} className={`fila__item ${i === 0 ? 'fila__item--proximo' : ''} ${g.id === grupoAtualId ? 'fila__item--jogando' : ''}`}>
              <span className="fila__ordem numero">{i + 1}</span>
              <span className="fila__nome">{g.nome}</span>
              {i === 0 && <span className="etiqueta">próximo</span>}
              {aoRemover && (
                <button type="button" className="botao botao--fantasma botao--pequeno botao--icone" onClick={() => aoRemover(g)} aria-label={`Remover ${g.nome}`}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {jogaram.length > 0 && (
        <>
          <h3 className="fila__titulo" style={{ marginTop: 18 }}>
            Já jogaram <span className="etiqueta etiqueta--neutra">{jogaram.length}</span>
          </h3>
          <ol className="fila__lista">
            {jogaram.map((g) => (
              <li key={g.id} className="fila__item fila__item--jogou">
                <span className="fila__ordem">✓</span>
                <span className="fila__nome">{g.nome}</span>
                <strong className="numero">{g.pontuacao || 0} pts</strong>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
