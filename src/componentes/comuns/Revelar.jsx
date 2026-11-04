import { useVisivel } from '../../ganchos/useVisivel.js';

/** Faz o conteúdo surgir (deslizando) quando entra na tela. */
export default function Revelar({ as: Tag = 'div', atraso = 0, className = '', children, ...resto }) {
  const [ref, visivel] = useVisivel({ umaVez: true });
  return (
    <Tag
      ref={ref}
      className={`revelar ${visivel ? 'revelar--visivel' : ''} ${className}`}
      style={{ transitionDelay: `${atraso}ms` }}
      {...resto}
    >
      {children}
    </Tag>
  );
}
