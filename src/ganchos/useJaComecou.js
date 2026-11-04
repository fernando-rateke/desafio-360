import { useEffect, useState } from 'react';

/** true a partir do horário `inicio` (ms), medido pelo relógio `agora`. */
export function useJaComecou(inicio, agora = Date.now) {
  const [comecou, setComecou] = useState(() => inicio != null && agora() >= inicio);
  useEffect(() => {
    if (inicio == null) {
      setComecou(false);
      return undefined;
    }
    const falta = inicio - agora();
    if (falta <= 0) {
      setComecou(true);
      return undefined;
    }
    setComecou(false);
    const t = setTimeout(() => setComecou(true), falta + 10);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio]);
  return comecou;
}
