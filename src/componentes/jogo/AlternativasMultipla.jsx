import { useEffect } from 'react';

export const LETRAS = ['A', 'B', 'C', 'D'];

/**
 * 4 alternativas. Atalhos de teclado no computador: 1–4 ou A–D.
 * `correta` (opcional) só é passado depois da correção, para colorir.
 */
export default function AlternativasMultipla({ alternativas, escolhida, aoEscolher, bloqueado, correta = null }) {
  useEffect(() => {
    if (bloqueado) return undefined;
    const tecla = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      const k = e.key.toUpperCase();
      const indice = '1234'.includes(k) ? Number(k) - 1 : LETRAS.indexOf(k);
      if (indice >= 0 && indice < alternativas.length) aoEscolher(indice);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [bloqueado, alternativas, aoEscolher]);

  return (
    <div className="alternativas" role="group" aria-label="Alternativas">
      {alternativas.map((texto, i) => {
        const estado =
          correta !== null
            ? i === correta
              ? 'correta'
              : i === escolhida
                ? 'errada'
                : 'apagada'
            : escolhida === i
              ? 'escolhida'
              : escolhida !== null && escolhida !== undefined
                ? 'apagada'
                : '';
        return (
          <button
            key={i}
            type="button"
            className={`alternativa alternativa--${LETRAS[i].toLowerCase()} ${estado && `alternativa--${estado}`}`}
            onClick={() => aoEscolher(i)}
            disabled={bloqueado}
            aria-pressed={escolhida === i}
          >
            <span className="alternativa__letra" aria-hidden="true">
              {LETRAS[i]}
            </span>
            <span className="alternativa__texto">{texto}</span>
            <kbd className="alternativa__atalho" aria-hidden="true">
              {i + 1}
            </kbd>
          </button>
        );
      })}
    </div>
  );
}
