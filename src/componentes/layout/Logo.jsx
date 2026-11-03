import { Link } from 'react-router-dom';

/** Marca: círculo unitário com o raio apontando para 30°. */
export function MarcaCirculo({ className = 'logo__marca' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M 32 10 A 22 22 0 1 1 12.95 43" fill="none" stroke="#e8b04a" strokeWidth="4" strokeLinecap="round" />
      <line x1="32" y1="32" x2="51.05" y2="21" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="51.05" cy="21" r="4.2" fill="#e8b04a" />
      <circle cx="32" cy="32" r="2.6" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ para = '/' }) {
  return (
    <Link to={para} className="logo" aria-label="Desafio 360 — início">
      <MarcaCirculo />
      <span>
        Desafio <strong>360</strong>
      </span>
    </Link>
  );
}
