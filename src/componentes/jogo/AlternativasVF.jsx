import { useEffect } from 'react';

/** Verdadeiro ou falso. Atalhos: V e F. */
export default function AlternativasVF({ escolhida, aoEscolher, bloqueado, correta = null }) {
  useEffect(() => {
    if (bloqueado) return undefined;
    const tecla = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      const k = e.key.toUpperCase();
      if (k === 'V' || k === '1') aoEscolher(true);
      if (k === 'F' || k === '2') aoEscolher(false);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [bloqueado, aoEscolher]);

  const opcoes = [
    { valor: true, texto: 'Verdadeiro', simbolo: 'V' },
    { valor: false, texto: 'Falso', simbolo: 'F' },
  ];

  return (
    <div className="alternativas alternativas--vf" role="group" aria-label="Verdadeiro ou falso">
      {opcoes.map((o) => {
        const estado =
          correta !== null
            ? o.valor === correta
              ? 'correta'
              : o.valor === escolhida
                ? 'errada'
                : 'apagada'
            : escolhida === o.valor
              ? 'escolhida'
              : escolhida === true || escolhida === false
                ? 'apagada'
                : '';
        return (
          <button
            key={o.texto}
            type="button"
            className={`alternativa alternativa--${o.valor ? 'v' : 'f'} ${estado && `alternativa--${estado}`}`}
            onClick={() => aoEscolher(o.valor)}
            disabled={bloqueado}
            aria-pressed={escolhida === o.valor}
          >
            <span className="alternativa__letra" aria-hidden="true">
              {o.simbolo}
            </span>
            <span className="alternativa__texto">{o.texto}</span>
          </button>
        );
      })}
    </div>
  );
}
