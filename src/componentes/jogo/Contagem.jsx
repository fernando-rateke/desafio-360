import { useEffect, useRef, useState } from 'react';
import { tocar } from '../../efeitos/sons.js';

/**
 * Tela cheia "3, 2, 1, Valendo!" até o horário `inicio` (ms).
 * `agora` deve devolver o horário no mesmo relógio (servidor ou local).
 */
export default function Contagem({ inicio, agora = Date.now, titulo }) {
  const calcular = () => (inicio ? inicio - agora() : -Infinity);
  const [faltam, setFaltam] = useState(calcular);
  const anterior = useRef(null);

  useEffect(() => {
    if (!inicio) return undefined;
    const id = setInterval(() => {
      const f = calcular();
      setFaltam(f);
      if (f < -800) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio]);

  const numero = faltam > 0 ? Math.ceil(faltam / 1000) : 0;
  useEffect(() => {
    if (faltam < -800 || anterior.current === numero) return;
    anterior.current = numero;
    tocar(numero > 0 ? 'contagem' : 'valendo');
  }, [numero, faltam]);

  if (!inicio || faltam < -700) return null;
  return (
    <div className="contagem" role="status" aria-live="assertive">
      {titulo && <p className="contagem__titulo">{titulo}</p>}
      <div className="contagem__palco">
        <svg className="contagem__anel" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" />
          <circle cx="50" cy="50" r="44" className="contagem__progresso" key={numero} />
        </svg>
        <span key={numero} className={`contagem__numero numero ${numero === 0 ? 'contagem__numero--valendo' : ''}`}>
          {numero > 0 ? numero : 'Valendo!'}
        </span>
      </div>
    </div>
  );
}
