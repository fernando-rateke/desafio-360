import { useEffect, useState } from 'react';

/**
 * Tempo restante (segundos, com décimos) de uma pergunta.
 * @param {number|null} inicioEm horário de início (ms) — null = parado
 * @param {number} total duração em segundos
 * @param {() => number} agora função que devolve o horário atual (ms)
 * @param {boolean} pausado congela o valor atual
 */
export function useCronometro(inicioEm, total, agora = Date.now, pausado = false) {
  const calcular = () => {
    if (!inicioEm || !total) return total || 0;
    return Math.max(0, total - (agora() - inicioEm) / 1000);
  };
  const [restante, setRestante] = useState(calcular);

  useEffect(() => {
    setRestante(calcular());
    if (!inicioEm || pausado) return undefined;
    const intervalo = setInterval(() => {
      const r = calcular();
      setRestante(r);
      if (r <= 0) clearInterval(intervalo);
    }, 100);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioEm, total, pausado]);

  return restante;
}
