/**
 * Cronômetro em forma de círculo trigonométrico: o raio gira no sentido
 * anti-horário (como os ângulos), partindo de 0°, enquanto o tempo passa.
 * O arco colorido é o tempo que ainda resta.
 */
const RAIO = 44;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export default function Cronometro({ restante, total, tamanho = 'normal', rotulo = 'Tempo restante' }) {
  const fracaoRestante = total > 0 ? Math.min(1, Math.max(0, restante / total)) : 0;
  const decorrido = 1 - fracaoRestante;
  const angulo = decorrido * 2 * Math.PI;
  const segundos = Math.ceil(restante);
  const urgente = restante > 0 && restante <= Math.min(10, total * 0.25);
  const esgotado = restante <= 0;

  const px = RAIO * Math.cos(angulo);
  const py = -RAIO * Math.sin(angulo);

  return (
    <div
      className={`cronometro cronometro--${tamanho} ${urgente ? 'cronometro--urgente' : ''} ${esgotado ? 'cronometro--esgotado' : ''}`}
      role="timer"
      aria-label={`${rotulo}: ${segundos} segundos`}
    >
      <svg viewBox="-56 -56 112 112" aria-hidden="true">
        <line x1="-52" y1="0" x2="52" y2="0" className="cronometro__eixo" />
        <line x1="0" y1="-52" x2="0" y2="52" className="cronometro__eixo" />
        <circle r={RAIO} className="cronometro__trilho" />
        <circle
          r={RAIO}
          className="cronometro__arco"
          transform="scale(1,-1)"
          strokeDasharray={`0 ${decorrido * CIRCUNFERENCIA} ${fracaoRestante * CIRCUNFERENCIA}`}
        />
        <line x1="0" y1="0" x2={px} y2={py} className="cronometro__raio" />
        <circle cx={px} cy={py} r="5" className="cronometro__ponto" />
      </svg>
      <span className="cronometro__numero numero">{segundos}</span>
    </div>
  );
}
