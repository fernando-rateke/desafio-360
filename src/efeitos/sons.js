/**
 * Sons sintetizados com Web Audio (nenhum arquivo para baixar).
 *   tocar('acerto' | 'erro' | 'tique' | 'contagem' | 'valendo' | 'clique' | 'fanfarra' | 'entrou')
 * O professor/aluno pode silenciar; a escolha fica salva no navegador.
 */
const CHAVE = 'desafio360:som';
let contexto = null;
let mudo = lerMudo();
const ouvintes = new Set();

function lerMudo() {
  try {
    return localStorage.getItem(CHAVE) === 'mudo';
  } catch {
    return false;
  }
}

export function estaMudo() {
  return mudo;
}

export function alternarMudo() {
  mudo = !mudo;
  try {
    localStorage.setItem(CHAVE, mudo ? 'mudo' : 'ligado');
  } catch {
    /* sem armazenamento */
  }
  ouvintes.forEach((f) => f(mudo));
  if (!mudo) tocar('clique');
  return mudo;
}

export function ouvirMudo(f) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

function ctx() {
  if (!contexto) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    contexto = new C();
  }
  if (contexto.state === 'suspended') contexto.resume().catch(() => {});
  return contexto;
}

/** Uma nota com envelope simples. */
function nota(c, { freq, inicio = 0, duracao = 0.15, tipo = 'sine', volume = 0.18, deslizarPara }) {
  const t0 = c.currentTime + inicio;
  const osc = c.createOscillator();
  const ganho = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (deslizarPara) osc.frequency.exponentialRampToValueAtTime(deslizarPara, t0 + duracao);
  ganho.gain.setValueAtTime(0.0001, t0);
  ganho.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  osc.connect(ganho).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duracao + 0.05);
}

const SONS = {
  clique: (c) => nota(c, { freq: 660, duracao: 0.06, tipo: 'triangle', volume: 0.1 }),
  tique: (c) => nota(c, { freq: 1180, duracao: 0.05, tipo: 'square', volume: 0.05 }),
  contagem: (c) => nota(c, { freq: 523, duracao: 0.18, tipo: 'triangle', volume: 0.16 }),
  valendo: (c) => {
    nota(c, { freq: 784, duracao: 0.12, tipo: 'triangle', volume: 0.16 });
    nota(c, { freq: 1047, inicio: 0.1, duracao: 0.3, tipo: 'triangle', volume: 0.18 });
  },
  acerto: (c) => {
    [523, 659, 784, 1047].forEach((f, i) => nota(c, { freq: f, inicio: i * 0.07, duracao: 0.22, tipo: 'triangle', volume: 0.15 }));
  },
  erro: (c) => {
    nota(c, { freq: 300, duracao: 0.22, tipo: 'sawtooth', volume: 0.07, deslizarPara: 180 });
    nota(c, { freq: 200, inicio: 0.18, duracao: 0.35, tipo: 'sawtooth', volume: 0.06, deslizarPara: 110 });
  },
  entrou: (c) => {
    nota(c, { freq: 880, duracao: 0.08, tipo: 'sine', volume: 0.12 });
    nota(c, { freq: 1320, inicio: 0.07, duracao: 0.14, tipo: 'sine', volume: 0.12 });
  },
  fanfarra: (c) => {
    const melodia = [523, 659, 784, 659, 784, 1047];
    melodia.forEach((f, i) => nota(c, { freq: f, inicio: i * 0.13, duracao: i === melodia.length - 1 ? 0.7 : 0.16, tipo: 'triangle', volume: 0.16 }));
    nota(c, { freq: 262, inicio: 0.65, duracao: 0.7, tipo: 'sine', volume: 0.12 });
  },
};

export function tocar(nome) {
  if (mudo || typeof window === 'undefined') return;
  try {
    const c = ctx();
    if (c && SONS[nome]) SONS[nome](c);
  } catch {
    /* áudio indisponível */
  }
}
