const ICONES = { info: 'ℹ️', alerta: '⚠️', erro: '⛔', sucesso: '✅' };

export default function Aviso({ tipo = 'info', titulo, children }) {
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <span className="aviso__icone" aria-hidden="true">
        {ICONES[tipo]}
      </span>
      <div>
        {titulo && <strong style={{ display: 'block', marginBottom: 4 }}>{titulo}</strong>}
        {children}
      </div>
    </div>
  );
}
