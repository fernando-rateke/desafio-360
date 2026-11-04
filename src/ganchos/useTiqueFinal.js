import { useEffect, useRef } from 'react';
import { tocar } from '../efeitos/sons.js';

/** Toca um "tique" a cada segundo nos últimos 5 segundos do cronômetro. */
export function useTiqueFinal(restante, ativo) {
  const ultimo = useRef(null);
  useEffect(() => {
    if (!ativo) {
      ultimo.current = null;
      return;
    }
    const s = Math.ceil(restante);
    if (s !== ultimo.current && s > 0 && s <= 5) tocar('tique');
    ultimo.current = s;
  }, [restante, ativo]);
}
