import { useEffect, useRef, useState } from 'react';

/**
 * Anima um número de `de` até `para` (pontuação "subindo", estilo Kahoot).
 */
export function useContagem(para, { de = 0, duracao = 1200, atraso = 0 } = {}) {
  const [valor, setValor] = useState(de);
  const quadro = useRef();

  useEffect(() => {
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduzir || de === para) {
      setValor(para);
      return undefined;
    }
    setValor(de);
    let inicio = null;
    const passo = (t) => {
      if (inicio === null) inicio = t + atraso;
      const p = Math.min(1, Math.max(0, (t - inicio) / duracao));
      const suave = 1 - Math.pow(1 - p, 3); // desacelera no fim
      setValor(Math.round(de + (para - de) * suave));
      if (p < 1) quadro.current = requestAnimationFrame(passo);
    };
    quadro.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro.current);
  }, [para, de, duracao, atraso]);

  return valor;
}
