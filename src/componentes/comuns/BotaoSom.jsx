import { useEffect, useState } from 'react';
import { alternarMudo, estaMudo, ouvirMudo } from '../../efeitos/sons.js';

/** Liga/desliga os efeitos sonoros. */
export default function BotaoSom({ className = '' }) {
  const [mudo, setMudo] = useState(estaMudo());
  useEffect(() => ouvirMudo(setMudo), []);
  return (
    <button
      type="button"
      className={`botao botao--fantasma botao--pequeno botao--icone botao-som ${className}`}
      onClick={() => alternarMudo()}
      aria-pressed={!mudo}
      aria-label={mudo ? 'Ligar sons' : 'Desligar sons'}
      title={mudo ? 'Ligar sons' : 'Desligar sons'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
        {mudo ? (
          <path d="m16 9 5 6m0-6-5 6" />
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  );
}
