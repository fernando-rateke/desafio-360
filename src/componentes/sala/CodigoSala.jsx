/** Código da sala em letras grandes (uma "peça" por letra). */
export default function CodigoSala({ codigo, tamanho = 'grande' }) {
  return (
    <div className={`codigo-sala codigo-sala--${tamanho}`} aria-label={`Código da sala: ${codigo.split('').join(' ')}`}>
      {codigo.split('').map((letra, i) => (
        <span key={i} className="codigo-sala__letra numero" aria-hidden="true">
          {letra}
        </span>
      ))}
    </div>
  );
}
