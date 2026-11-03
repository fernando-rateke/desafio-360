import { MarcaCirculo } from '../layout/Logo.jsx';

/** Tela dos grupos que estão esperando a vez. */
export default function TelaEspera({ titulo, children }) {
  return (
    <section className="espera surgir">
      <div className="espera__roleta" aria-hidden="true">
        <MarcaCirculo className="espera__marca" />
      </div>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
