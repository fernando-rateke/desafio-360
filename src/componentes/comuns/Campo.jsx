import { useId } from 'react';

/** Rótulo + entrada (input, textarea ou select) + dica/erro. */
export default function Campo({ rotulo, dica, erro, como = 'input', children, className = '', ...props }) {
  const id = useId();
  const Elemento = como;
  return (
    <div className={`campo ${className}`}>
      {rotulo && (
        <label className="campo__rotulo" htmlFor={id}>
          {rotulo}
        </label>
      )}
      <Elemento id={id} className={`entrada ${erro ? 'entrada--erro' : ''}`} aria-invalid={!!erro} {...props}>
        {children}
      </Elemento>
      {erro ? (
        <span className="campo__dica" style={{ color: 'var(--erro)' }}>
          {erro}
        </span>
      ) : (
        dica && <span className="campo__dica">{dica}</span>
      )}
    </div>
  );
}
