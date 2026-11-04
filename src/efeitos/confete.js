/**
 * Confete em canvas (sem bibliotecas). Respeita "reduzir movimento".
 *   soltarConfete({ quantidade: 160, origem: { x: 0.5, y: 0.4 } })
 */
const CORES = ['#e8b04a', '#f5cf85', '#6cc0c0', '#45c486', '#d4874a', '#4b93c9', '#9c79c9', '#f3efe6'];

let canvas = null;
let ctx = null;
let pecas = [];
let quadro = null;

function preparar() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'confete-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '100' });
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  redimensionar();
  window.addEventListener('resize', redimensionar);
}

function redimensionar() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function desenhar() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);
  pecas = pecas.filter((p) => p.y < h + 40 && p.vida > 0);
  for (const p of pecas) {
    p.vx *= 0.985;
    p.vy = p.vy * 0.985 + 0.16;
    p.x += p.vx;
    p.y += p.vy;
    p.giro += p.vgiro;
    p.vida -= 0.004;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.giro);
    ctx.globalAlpha = Math.min(1, p.vida * 2);
    ctx.fillStyle = p.cor;
    const larg = p.tam * Math.abs(Math.cos(p.giro * 1.7)); // "vira" no ar
    if (p.forma === 0) ctx.fillRect(-larg / 2, -p.tam / 3, larg, (p.tam * 2) / 3);
    else {
      ctx.beginPath();
      ctx.ellipse(0, 0, larg / 2, p.tam / 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (pecas.length) quadro = requestAnimationFrame(desenhar);
  else {
    quadro = null;
    ctx.clearRect(0, 0, w, h);
  }
}

export function soltarConfete({ quantidade = 140, origem = { x: 0.5, y: 0.35 }, espalhar = 1 } = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  preparar();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const n = Math.round(quantidade * (w < 600 ? 0.6 : 1));
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9 * espalhar;
    const vel = 7 + Math.random() * 9;
    pecas.push({
      x: origem.x * w,
      y: origem.y * h,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.4,
      tam: 7 + Math.random() * 7,
      cor: CORES[(Math.random() * CORES.length) | 0],
      forma: Math.random() > 0.35 ? 0 : 1,
      vida: 1,
    });
  }
  if (!quadro) quadro = requestAnimationFrame(desenhar);
}

/** Chuva de confete vinda do topo (pódio). */
export function chuvaDeConfete(segundos = 3) {
  const inicio = performance.now();
  const lancar = () => {
    soltarConfete({ quantidade: 40, origem: { x: Math.random(), y: -0.05 }, espalhar: 0.6 });
    if (performance.now() - inicio < segundos * 1000) setTimeout(lancar, 260);
  };
  lancar();
}
