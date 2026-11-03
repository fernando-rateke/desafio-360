export default function Carregando({ texto = 'Carregando…' }) {
  return (
    <div className="carregando" role="status">
      <svg className="carregando__circulo" viewBox="0 0 50 50" aria-hidden="true">
        <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(243,239,230,0.15)" strokeWidth="4" />
        <path d="M25 5 A20 20 0 0 1 45 25" fill="none" stroke="#e8b04a" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span>{texto}</span>
    </div>
  );
}
