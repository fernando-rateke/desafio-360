import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Diz se um elemento está visível na tela (IntersectionObserver).
 * Uso: const [ref, visivel] = useVisivel({ umaVez: true });
 */
export function useVisivel({ umaVez = false, margem = '0px 0px -12% 0px', limiar = 0.15 } = {}) {
  const [visivel, setVisivel] = useState(false);
  const observador = useRef(null);

  const ref = useCallback(
    (elemento) => {
      observador.current?.disconnect();
      if (!elemento) return;
      if (typeof IntersectionObserver === 'undefined') {
        setVisivel(true);
        return;
      }
      observador.current = new IntersectionObserver(
        ([entrada]) => {
          if (entrada.isIntersecting) {
            setVisivel(true);
            if (umaVez) observador.current?.disconnect();
          } else if (!umaVez) {
            setVisivel(false);
          }
        },
        { rootMargin: margem, threshold: limiar },
      );
      observador.current.observe(elemento);
    },
    [umaVez, margem, limiar],
  );

  useEffect(() => () => observador.current?.disconnect(), []);
  return [ref, visivel];
}
