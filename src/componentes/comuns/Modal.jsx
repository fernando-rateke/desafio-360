import { useEffect } from 'react';

export default function Modal({ aberto, titulo, aoFechar, children, acoes }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === 'Escape' && aoFechar?.();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        {titulo && <h2>{titulo}</h2>}
        {children}
        {acoes && <div className="modal__acoes">{acoes}</div>}
      </div>
    </div>
  );
}
