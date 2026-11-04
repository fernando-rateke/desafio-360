import { useEffect } from 'react';
import { ANGULOS_NOTAVEIS, dadosDoAngulo } from '../../logica/angulos.js';

/**
 * Versão 2D (SVG) da roleta, para aparelhos sem WebGL.
 * O disco gira com CSS; a janela fica à direita (0°).
 */
export default function RoletaPlana({ angulo, destaque, aoMudarAngulo }) {
  useEffect(() => {
    aoMudarAngulo?.(angulo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passo = (dir) => {
    const lista = ANGULOS_NOTAVEIS.map((a) => a.graus);
    const i = lista.indexOf(dadosDoAngulo(angulo)?.graus ?? 0);
    aoMudarAngulo?.(lista[(i + dir + lista.length) % lista.length]);
  };

  return (
    <div className="roleta-plana">
      <svg viewBox="-120 -120 240 240" aria-hidden="true">
        <rect x="-115" y="-115" width="230" height="230" rx="18" fill="#b8874f" />
        <g style={{ transform: `rotate(${angulo}deg)`, transition: 'transform 600ms cubic-bezier(.2,.8,.2,1)' }}>
          <circle r="96" fill="#d9b07a" stroke="#3a220e" strokeWidth="1.5" />
          {destaque === 'quadrantes' &&
            ['#d4874a', '#4b93c9', '#4fa877', '#9c79c9'].map((cor, q) => {
              const a0 = (-90 * q * Math.PI) / 180;
              const a1 = (-90 * (q + 1) * Math.PI) / 180;
              return (
                <path
                  key={cor}
                  d={`M0 0 L${96 * Math.cos(a0)} ${96 * Math.sin(a0)} A96 96 0 0 0 ${96 * Math.cos(a1)} ${96 * Math.sin(a1)} Z`}
                  fill={cor}
                  opacity="0.35"
                />
              );
            })}
          {ANGULOS_NOTAVEIS.map((a) => (
            <g key={a.graus} transform={`rotate(${-a.graus})`}>
              <text x="40" y="-4" fontSize="7" fill="#3a220e" fontFamily="sans-serif">
                {`sen ${a.sen}`}
              </text>
              <text x="40" y="5" fontSize="7" fill="#3a220e" fontFamily="sans-serif">
                {`cos ${a.cos}`}
              </text>
              <text x="74" y="2" fontSize="10" fontWeight="700" fill="#3a220e" fontFamily="sans-serif">
                {`${a.graus}°`}
              </text>
            </g>
          ))}
        </g>
        <rect x="36" y="-11" width="62" height="22" rx="3" fill="rgba(255,255,255,0.08)" stroke="#e8b04a" strokeWidth="2.5" />
        <circle r="12" fill="#8c5e30" />
      </svg>
      <div className="roleta-plana__controles">
        <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => passo(-1)} aria-label="Ângulo anterior">
          ◀
        </button>
        <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => passo(1)} aria-label="Próximo ângulo">
          ▶
        </button>
      </div>
    </div>
  );
}
