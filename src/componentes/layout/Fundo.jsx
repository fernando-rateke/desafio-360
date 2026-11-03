/**
 * Fundo discreto: grade do plano cartesiano, círculo unitário e uma senoide.
 */
export default function Fundo() {
  // Senoide desenhada como caminho SVG (2 períodos ao longo de 1600px)
  const pontos = [];
  for (let x = 0; x <= 1600; x += 10) {
    const y = 760 + 70 * Math.sin((x / 800) * 2 * Math.PI);
    pontos.push(`${x},${y.toFixed(1)}`);
  }
  const cosseno = [];
  for (let x = 0; x <= 1600; x += 10) {
    const y = 760 + 70 * Math.cos((x / 800) * 2 * Math.PI);
    cosseno.push(`${x},${y.toFixed(1)}`);
  }

  return (
    <div className="fundo" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grade" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(243,239,230,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1600" height="900" fill="url(#grade)" />

        {/* Círculo unitário no canto superior direito */}
        <g transform="translate(1320 230)" stroke="rgba(243,239,230,0.07)" fill="none" strokeWidth="1.5">
          <line x1="-300" y1="0" x2="300" y2="0" />
          <line x1="0" y1="-300" x2="0" y2="300" />
          <circle r="220" />
          <circle r="220" stroke="rgba(232,176,74,0.10)" strokeDasharray="4 10" />
          {[30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330].map((g) => {
            const r = (g * Math.PI) / 180;
            return (
              <line
                key={g}
                x1="0"
                y1="0"
                x2={(220 * Math.cos(r)).toFixed(1)}
                y2={(-220 * Math.sin(r)).toFixed(1)}
                stroke="rgba(243,239,230,0.035)"
              />
            );
          })}
          <line x1="0" y1="0" x2="190.5" y2="-110" stroke="rgba(232,176,74,0.16)" strokeWidth="2" />
          <circle cx="190.5" cy="-110" r="5" fill="rgba(232,176,74,0.22)" stroke="none" />
        </g>

        {/* Senoide e cossenoide na parte inferior */}
        <polyline points={pontos.join(' ')} fill="none" stroke="rgba(232,176,74,0.11)" strokeWidth="2" />
        <polyline points={cosseno.join(' ')} fill="none" stroke="rgba(108,192,192,0.08)" strokeWidth="2" strokeDasharray="6 8" />
      </svg>
    </div>
  );
}
