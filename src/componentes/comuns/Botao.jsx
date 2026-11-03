import { Link } from 'react-router-dom';

/**
 * Botão padrão. Use `para` para virar um link do React Router.
 * variante: primario | secundario | fantasma | perigo | sucesso
 * tamanho: normal | grande | pequeno
 */
export default function Botao({
  variante = 'primario',
  tamanho = 'normal',
  bloco = false,
  para,
  className = '',
  type = 'button',
  children,
  ...resto
}) {
  const classes = [
    'botao',
    `botao--${variante}`,
    tamanho !== 'normal' && `botao--${tamanho}`,
    bloco && 'botao--bloco',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (para) {
    return (
      <Link to={para} className={classes} {...resto}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...resto}>
      {children}
    </button>
  );
}
