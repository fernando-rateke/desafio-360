/**
 * Roleta trigonométrica em 3D (Three.js), feita 100% em código:
 * placa de MDF, disco giratório "gravado a laser" com os 16 ângulos notáveis,
 * braço fixo com a JANELA de leitura, pino central, anel brilhante e partículas.
 *
 * Convenção: a janela fica no lado direito (direção de 0°). Girar o disco até
 * o ângulo θ significa trazer o setor θ para baixo da janela (disco.rotation.y = −θ).
 *
 * Uso:
 *   const cena = new RoletaCena(elemento, { aoMudarAngulo: (g) => ... });
 *   cena.setAngulo(150); cena.setVista('janela'); cena.setDestaque('quadrantes');
 *   cena.dispose();
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ANGULOS_NOTAVEIS, anguloNotavelMaisProximo, normalizarGraus } from '../logica/angulos.js';

/* ------------------------------------------------------------------ */
/* Constantes de geometria (unidades da cena)                           */
/* ------------------------------------------------------------------ */
const R = 1.9; // raio do disco
const LADO_BASE = 4.6;
const ALT_BASE = 0.22;
const ALT_DISCO = 0.07;
const Y_DISCO = ALT_BASE + 0.02;
const Y_TOPO_DISCO = Y_DISCO + ALT_DISCO;
const JANELA = { x0: 0.37 * R, x1: 0.995 * R, meia: 0.075 * R };

const COR_FUNDO = 0x0b1f26;
const AMBAR = new THREE.Color('#e8b04a');
const TEAL = new THREE.Color('#6cc0c0');

const VISTAS = {
  hero: { pos: [1.2, 5.6, 6.4], alvo: [0.35, 0.0, 0.1] },
  geral: { pos: [0.0, 6.6, 6.2], alvo: [0, 0, 0] },
  topo: { pos: [0.0, 9.2, 0.9], alvo: [0, 0, 0.15] },
  janela: { pos: [2.3, 3.1, 2.15], alvo: [1.25, 0.1, 0] },
  lado: { pos: [-5.2, 3.0, 5.4], alvo: [0, 0.2, 0] },
};

const SEQUENCIA_DEMO = [30, 45, 60, 90, 120, 150, 180, 225, 270, 300, 330, 0];

/** O navegador consegue desenhar WebGL? */
export function webglDisponivel() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const radDe = (g) => (g * Math.PI) / 180;
const grausDe = (r) => (r * 180) / Math.PI;
const amortecer = (atual, alvo, lambda, dt) => THREE.MathUtils.lerp(atual, alvo, 1 - Math.exp(-lambda * dt));

/* ------------------------------------------------------------------ */
/* Texturas desenhadas em canvas                                        */
/* ------------------------------------------------------------------ */
function veiosMadeira(ctx, w, h, semente = 1) {
  let s = semente;
  const aleatorio = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  ctx.save();
  for (let i = 0; i < 260; i++) {
    const y = aleatorio() * h;
    ctx.strokeStyle = aleatorio() > 0.5 ? 'rgba(120,78,38,0.07)' : 'rgba(255,236,200,0.06)';
    ctx.lineWidth = 0.6 + aleatorio() * 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += w / 12) {
      ctx.lineTo(x, y + Math.sin(x * 0.004 + i) * 6 + (aleatorio() - 0.5) * 3);
    }
    ctx.stroke();
  }
  // Pontinhos do MDF
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = aleatorio() > 0.5 ? 'rgba(90,55,25,0.08)' : 'rgba(255,240,210,0.07)';
    ctx.fillRect(aleatorio() * w, aleatorio() * h, 1.5, 1.5);
  }
  ctx.restore();
}

function texturaDisco(qualidade) {
  const T = qualidade === 'baixa' ? 1536 : 2048;
  const c = document.createElement('canvas');
  c.width = c.height = T;
  const ctx = c.getContext('2d');
  const cx = T / 2;
  const Rp = T / 2; // raio em pixels
  const escala = T / 2048;

  // MDF claro com leve degradê
  const g = ctx.createRadialGradient(cx, cx, Rp * 0.1, cx, cx, Rp);
  g.addColorStop(0, '#e2bb86');
  g.addColorStop(1, '#c99a62');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, T, T);
  veiosMadeira(ctx, T, T, 7);

  // Quadrantes com tinta bem suave
  const tintas = ['rgba(212,135,74,0.10)', 'rgba(75,147,201,0.10)', 'rgba(79,168,119,0.10)', 'rgba(156,121,201,0.10)'];
  tintas.forEach((cor, q) => {
    ctx.beginPath();
    ctx.moveTo(cx, cx);
    // Canvas: ângulo positivo é horário; o quadrante q (CCW) vai de −90(q+1)° a −90q°
    ctx.arc(cx, cx, Rp * 0.985, -radDe(90 * (q + 1)), -radDe(90 * q));
    ctx.closePath();
    ctx.fillStyle = cor;
    ctx.fill();
  });

  const queimado = 'rgba(58,34,14,0.9)';
  const queimadoSuave = 'rgba(58,34,14,0.45)';

  // Anéis gravados
  ctx.strokeStyle = queimado;
  ctx.lineWidth = 5 * escala;
  for (const f of [0.985, 0.355]) {
    ctx.beginPath();
    ctx.arc(cx, cx, Rp * f, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 2 * escala;
  ctx.strokeStyle = queimadoSuave;
  ctx.beginPath();
  ctx.arc(cx, cx, Rp * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  // Separadores no meio do caminho entre ângulos vizinhos
  const lista = ANGULOS_NOTAVEIS.map((a) => a.graus);
  lista.forEach((gAtual, i) => {
    const proximo = i + 1 < lista.length ? lista[i + 1] : 360;
    const meio = (gAtual + proximo) / 2;
    ctx.save();
    ctx.translate(cx, cx);
    ctx.rotate(-radDe(meio));
    ctx.strokeStyle = queimadoSuave;
    ctx.lineWidth = 2 * escala;
    ctx.beginPath();
    ctx.moveTo(Rp * 0.37, 0);
    ctx.lineTo(Rp * 0.975, 0);
    ctx.stroke();
    ctx.restore();
  });

  // Conteúdo de cada setor, escrito ao longo do raio (lê-se normal quando está sob a janela)
  const fonteNum = '"Space Grotesk", "Inter", "Segoe UI", system-ui, sans-serif';
  for (const a of ANGULOS_NOTAVEIS) {
    ctx.save();
    ctx.translate(cx, cx);
    ctx.rotate(-radDe(a.graus));
    ctx.fillStyle = queimado;
    ctx.textBaseline = 'middle';

    // Marca no aro
    ctx.fillRect(Rp * 0.94, -3 * escala, Rp * 0.04, 6 * escala);

    // Valores: sen, cos, tg
    ctx.font = `600 ${Math.round(31 * escala)}px ${fonteNum}`;
    ctx.fillText(`sen ${a.sen}`, Rp * 0.4, -35 * escala);
    ctx.fillText(`cos ${a.cos}`, Rp * 0.4, 0);
    ctx.fillText(`tg ${a.tg}`, Rp * 0.4, 35 * escala);

    // Graus e radianos
    ctx.font = `700 ${Math.round(56 * escala)}px ${fonteNum}`;
    ctx.fillText(`${a.graus}°`, Rp * 0.795, -20 * escala);
    ctx.font = `600 ${Math.round(38 * escala)}px ${fonteNum}`;
    ctx.fillText(a.radianos === '0' ? '0 rad' : a.radianos, Rp * 0.795, 30 * escala);
    ctx.restore();
  }

  // Centro: título gravado em volta do pino
  ctx.save();
  ctx.translate(cx, cx);
  ctx.fillStyle = queimadoSuave;
  ctx.font = `700 ${Math.round(34 * escala)}px ${fonteNum}`;
  const texto = 'DESAFIO 360 · CÍRCULO TRIGONOMÉTRICO · ';
  const raioTexto = Rp * 0.27;
  for (let i = 0; i < texto.length; i++) {
    const ang = (i / texto.length) * Math.PI * 2;
    ctx.save();
    ctx.rotate(ang);
    ctx.translate(0, -raioTexto);
    ctx.fillText(texto[i], -8 * escala, 0);
    ctx.restore();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function texturaBase() {
  const T = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = T;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8874f';
  ctx.fillRect(0, 0, T, T);
  veiosMadeira(ctx, T, T, 3);

  const queimado = 'rgba(52,30,12,0.8)';
  ctx.strokeStyle = queimado;
  ctx.lineWidth = 4;
  const m = 26;
  ctx.beginPath();
  ctx.roundRect(m, m, T - 2 * m, T - 2 * m, 48);
  ctx.stroke();

  // Parafusos
  for (const [x, y] of [[70, 70], [T - 70, 70], [70, T - 70], [T - 70, T - 70]]) {
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 18);
    g.addColorStop(0, '#f3efe6');
    g.addColorStop(1, '#5c5f63');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,30,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x + 9, y);
    ctx.stroke();
  }

  // Numerais dos quadrantes nos cantos
  ctx.fillStyle = queimado;
  ctx.font = '700 46px "Space Grotesk", "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('I', T - 130, 130);
  ctx.fillText('II', 130, 130);
  ctx.fillText('III', 130, T - 130);
  ctx.fillText('IV', T - 130, T - 130);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function texturaParticula() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* A cena                                                               */
/* ------------------------------------------------------------------ */
export class RoletaCena {
  /**
   * @param {HTMLElement} container
   * @param {{
   *   interativa?: boolean, demo?: boolean, vista?: string, angulo?: number,
   *   aoMudarAngulo?: (graus: number) => void, aoInteragir?: () => void,
   *   reduzirMovimento?: boolean,
   * }} opcoes
   */
  constructor(container, opcoes = {}) {
    this.container = container;
    this._loop = this._loop.bind(this);
    this.quadro = null;
    this.opcoes = { interativa: true, demo: false, vista: 'hero', angulo: 30, ...opcoes };
    this.reduzir = opcoes.reduzirMovimento ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const toque = window.matchMedia?.('(pointer: coarse)').matches;
    const fraco = (navigator.hardwareConcurrency || 4) <= 4;
    this.qualidade = toque || window.innerWidth < 760 ? (fraco ? 'baixa' : 'media') : 'alta';

    this.descartaveis = [];
    this.relogio = new THREE.Clock();
    this.visivel = true;
    this.ativo = true;

    this._criarRenderer();
    this._criarCena();
    this._criarRoleta();
    this._criarEfeitos();
    this._criarPosProcessamento();
    this._ligarEventos();

    // Estado da rotação do disco (radianos) com mola
    this.rot = -radDe(this.opcoes.angulo);
    this.rotAlvo = this.rot;
    this.velocidade = 0;
    this.arrastando = false;
    this.ultimoGrau = null;
    this.ultimaInteracao = -Infinity;
    this.proximaDemo = 2.5;
    this.indiceDemo = 0;
    this.pulso = 0;

    this.vista = VISTAS[this.opcoes.vista] || VISTAS.hero;
    this.camPos = new THREE.Vector3(...this.vista.pos);
    this.camAlvo = new THREE.Vector3(...this.vista.alvo);
    this.camera.position.copy(this.camPos).add(new THREE.Vector3(0, 2.5, 3)); // entra "voando"
    this.alvoAtual = this.camAlvo.clone();
    this.mouse = new THREE.Vector2();
    this.destaque = null;
    this.intensidades = { base: 0, disco: 0, janela: 0, quadrantes: 0, eixos: 0 };

    this.prontoParaAnimar = true;
    this._redimensionar(); // também agenda o primeiro quadro
  }

  /* ---------------- Construção ---------------- */
  _criarRenderer() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.qualidade === 'alta' ? 2 : 1.5);
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = this.qualidade === 'alta';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(COR_FUNDO, 1);
    const canvas = this.renderer.domElement;
    canvas.className = 'roleta3d__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    this.container.appendChild(canvas);
  }

  _criarCena() {
    this.cena = new THREE.Scene();
    this.cena.background = new THREE.Color(COR_FUNDO);
    this.cena.fog = new THREE.Fog(COR_FUNDO, 11, 22);

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);

    this.cena.add(new THREE.HemisphereLight(0xcfeaff, 0x2a1a0c, 0.75));
    const sol = new THREE.DirectionalLight(0xffe3bd, 1.9);
    sol.position.set(4, 8.5, 3.5);
    sol.castShadow = this.renderer.shadowMap.enabled;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.camera.left = -4;
    sol.shadow.camera.right = 4;
    sol.shadow.camera.top = 4;
    sol.shadow.camera.bottom = -4;
    sol.shadow.bias = -0.0004;
    this.cena.add(sol);
    const contraluz = new THREE.PointLight(0x6cc0c0, 26, 18, 2);
    contraluz.position.set(-4.5, 2.2, -4);
    this.cena.add(contraluz);
    const ambar = new THREE.PointLight(0xe8b04a, 5, 10, 2);
    ambar.position.set(3.5, 1.2, 2.5);
    this.cena.add(ambar);
  }

  _material(params) {
    const m = new THREE.MeshStandardMaterial(params);
    this.descartaveis.push(m);
    return m;
  }

  _geometria(g) {
    this.descartaveis.push(g);
    return g;
  }

  _criarRoleta() {
    this.roleta = new THREE.Group();
    this.cena.add(this.roleta);

    // Base de MDF com cantos arredondados
    const forma = new THREE.Shape();
    const h = LADO_BASE / 2;
    const r = 0.32;
    forma.moveTo(-h + r, -h);
    forma.lineTo(h - r, -h);
    forma.quadraticCurveTo(h, -h, h, -h + r);
    forma.lineTo(h, h - r);
    forma.quadraticCurveTo(h, h, h - r, h);
    forma.lineTo(-h + r, h);
    forma.quadraticCurveTo(-h, h, -h, h - r);
    forma.lineTo(-h, -h + r);
    forma.quadraticCurveTo(-h, -h, -h + r, -h);
    const geoBase = this._geometria(
      new THREE.ExtrudeGeometry(forma, { depth: ALT_BASE, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 10 }),
    );
    geoBase.rotateX(-Math.PI / 2);
    const texBase = texturaBase();
    texBase.repeat.set(1 / LADO_BASE, 1 / LADO_BASE);
    texBase.offset.set(0.5, 0.5);
    this.descartaveis.push(texBase);
    this.matBase = this._material({ map: texBase, roughness: 0.78, metalness: 0, emissive: AMBAR, emissiveIntensity: 0 });
    const matLateral = this._material({ color: 0x6e4a26, roughness: 0.9 });
    this.base = new THREE.Mesh(geoBase, [this.matBase, matLateral]);
    this.base.receiveShadow = true;
    this.roleta.add(this.base);

    // Disco giratório
    this.disco = new THREE.Group();
    this.disco.position.y = Y_DISCO;
    this.roleta.add(this.disco);

    const geoBorda = this._geometria(new THREE.CylinderGeometry(R, R, ALT_DISCO, 128, 1, true));
    geoBorda.translate(0, ALT_DISCO / 2, 0);
    this.matBordaDisco = this._material({ color: 0x7a5129, roughness: 0.85, emissive: AMBAR, emissiveIntensity: 0 });
    const borda = new THREE.Mesh(geoBorda, this.matBordaDisco);
    borda.castShadow = true;
    this.disco.add(borda);

    const geoTampa = this._geometria(new THREE.CircleGeometry(R, 128));
    geoTampa.rotateX(-Math.PI / 2);
    const texDisco = texturaDisco(this.qualidade);
    this.descartaveis.push(texDisco);
    this.matDisco = this._material({ map: texDisco, roughness: 0.72, emissive: AMBAR, emissiveIntensity: 0 });
    const tampa = new THREE.Mesh(geoTampa, this.matDisco);
    tampa.position.y = ALT_DISCO;
    tampa.receiveShadow = true;
    tampa.castShadow = true;
    this.disco.add(tampa);

    // Sombra "fake" embaixo do disco (para quando não há shadow map)
    const geoSombra = this._geometria(new THREE.CircleGeometry(R * 1.04, 64));
    geoSombra.rotateX(-Math.PI / 2);
    const sombra = new THREE.Mesh(
      geoSombra,
      this._material({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    sombra.position.y = ALT_BASE + 0.035;
    this.roleta.add(sombra);

    // Sobreposições dos quadrantes (giram com o disco)
    const coresQ = ['#d4874a', '#4b93c9', '#4fa877', '#9c79c9'];
    this.quadrantes = coresQ.map((cor, q) => {
      const geo = this._geometria(new THREE.RingGeometry(R * 0.37, R * 0.975, 48, 1, radDe(90 * q), Math.PI / 2));
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, depthWrite: false });
      this.descartaveis.push(mat);
      const malha = new THREE.Mesh(geo, mat);
      malha.position.y = ALT_DISCO + 0.003;
      this.disco.add(malha);
      return malha;
    });

    // Marcadores de 90° e 270° (tangente não existe)
    this.marcasEixo = [90, 270].map((g) => {
      const geo = this._geometria(new THREE.BoxGeometry(R * 0.6, 0.02, 0.05));
      const mat = new THREE.MeshBasicMaterial({ color: '#ff6f61', transparent: true, opacity: 0 });
      this.descartaveis.push(mat);
      const m = new THREE.Mesh(geo, mat);
      const ang = radDe(g);
      const raio = R * 0.66;
      m.position.set(Math.cos(ang) * raio, ALT_DISCO + 0.012, -Math.sin(ang) * raio);
      m.rotation.y = ang;
      this.disco.add(m);
      return m;
    });

    // Braço fixo com a janela (lado direito, direção de 0°)
    const matBraco = this._material({ color: 0xa8773f, roughness: 0.7, emissive: AMBAR, emissiveIntensity: 0 });
    this.matBraco = matBraco;
    const yBraco = Y_TOPO_DISCO + 0.035;
    const esp = 0.05;
    const largura = JANELA.meia * 2 + 0.16;
    const pecas = [
      // [x0, x1, z0, z1]
      [-0.05, JANELA.x0, -largura / 2, largura / 2], // ligação até o pino
      [JANELA.x0, JANELA.x1 + 0.08, -largura / 2, -JANELA.meia], // barra de cima
      [JANELA.x0, JANELA.x1 + 0.08, JANELA.meia, largura / 2], // barra de baixo
      [JANELA.x1, JANELA.x1 + 0.08, -JANELA.meia, JANELA.meia], // ponta
    ];
    this.braco = new THREE.Group();
    for (const [x0, x1, z0, z1] of pecas) {
      const geo = this._geometria(new THREE.BoxGeometry(x1 - x0, esp, z1 - z0));
      const m = new THREE.Mesh(geo, matBraco);
      m.position.set((x0 + x1) / 2, yBraco, (z0 + z1) / 2);
      m.castShadow = true;
      this.braco.add(m);
    }
    // Acrílico da janela
    const geoVidro = this._geometria(new THREE.PlaneGeometry(JANELA.x1 - JANELA.x0, JANELA.meia * 2));
    geoVidro.rotateX(-Math.PI / 2);
    this.matVidro = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      roughness: 0.05,
      metalness: 0.2,
      depthWrite: false,
    });
    this.descartaveis.push(this.matVidro);
    const vidro = new THREE.Mesh(geoVidro, this.matVidro);
    vidro.position.set((JANELA.x0 + JANELA.x1) / 2, yBraco - esp / 2 + 0.004, 0);
    this.braco.add(vidro);
    // Contorno brilhante da janela (o bloom deixa ele "aceso")
    const pts = [
      [JANELA.x0, -JANELA.meia],
      [JANELA.x1, -JANELA.meia],
      [JANELA.x1, JANELA.meia],
      [JANELA.x0, JANELA.meia],
      [JANELA.x0, -JANELA.meia],
    ].map(([x, z]) => new THREE.Vector3(x, yBraco - esp / 2 + 0.006, z));
    const geoContorno = this._geometria(new THREE.BufferGeometry().setFromPoints(pts));
    this.matContorno = new THREE.LineBasicMaterial({ color: AMBAR.clone().multiplyScalar(2.2), transparent: true, opacity: 0.9 });
    this.descartaveis.push(this.matContorno);
    this.braco.add(new THREE.Line(geoContorno, this.matContorno));
    this.roleta.add(this.braco);

    // Pino central
    const geoPino = this._geometria(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 48));
    const pino = new THREE.Mesh(geoPino, this._material({ color: 0x8c5e30, roughness: 0.6 }));
    pino.position.y = yBraco + 0.07;
    pino.castShadow = true;
    this.roleta.add(pino);
    const geoTampaPino = this._geometria(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32));
    const tampaPino = new THREE.Mesh(geoTampaPino, this._material({ color: 0xd9dde0, roughness: 0.25, metalness: 0.9 }));
    tampaPino.position.y = yBraco + 0.19;
    this.roleta.add(tampaPino);
  }

  _criarEfeitos() {
    // Anel brilhante = o círculo unitário
    const geoAnel = this._geometria(new THREE.TorusGeometry(R + 0.12, 0.014, 12, 220));
    geoAnel.rotateX(Math.PI / 2);
    this.matAnel = new THREE.MeshBasicMaterial({ color: AMBAR.clone().multiplyScalar(1.7) });
    this.descartaveis.push(this.matAnel);
    this.anel = new THREE.Mesh(geoAnel, this.matAnel);
    this.anel.position.y = Y_DISCO + 0.02;
    this.roleta.add(this.anel);

    // Onda senoidal circulando em volta da roleta
    this.nOnda = 360;
    const posOnda = new Float32Array(this.nOnda * 3);
    const geoOnda = this._geometria(new THREE.BufferGeometry());
    geoOnda.setAttribute('position', new THREE.BufferAttribute(posOnda, 3));
    this.matOnda = new THREE.LineBasicMaterial({ color: TEAL.clone().multiplyScalar(1.6), transparent: true, opacity: 0.45 });
    this.descartaveis.push(this.matOnda);
    this.onda = new THREE.LineLoop(geoOnda, this.matOnda);
    this.cena.add(this.onda);

    // Partículas
    const n = this.qualidade === 'alta' ? 1400 : this.qualidade === 'media' ? 800 : 450;
    const pos = new Float32Array(n * 3);
    const cores = new Float32Array(n * 3);
    this.fasesParticulas = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const raio = 3.1 + Math.pow(Math.random(), 0.7) * 6.5;
      pos[i * 3] = Math.cos(ang) * raio;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.5 + Math.sin(ang * 3) * 0.6;
      pos[i * 3 + 2] = Math.sin(ang) * raio;
      const cor = Math.random() > 0.55 ? AMBAR : TEAL;
      const brilho = 0.6 + Math.random() * 0.9;
      cores[i * 3] = cor.r * brilho;
      cores[i * 3 + 1] = cor.g * brilho;
      cores[i * 3 + 2] = cor.b * brilho;
      this.fasesParticulas[i] = Math.random() * Math.PI * 2;
    }
    const geoP = this._geometria(new THREE.BufferGeometry());
    geoP.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geoP.setAttribute('color', new THREE.BufferAttribute(cores, 3));
    const texP = texturaParticula();
    this.descartaveis.push(texP);
    const matP = new THREE.PointsMaterial({
      size: 0.07,
      map: texP,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });
    this.descartaveis.push(matP);
    this.particulas = new THREE.Points(geoP, matP);
    this.cena.add(this.particulas);
  }

  _criarPosProcessamento() {
    this.usarBloom = this.qualidade !== 'baixa';
    if (!this.usarBloom) return;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.cena, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.3, 0.97);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  /* ---------------- Interação ---------------- */
  _ligarEventos() {
    const canvas = this.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y_TOPO_DISCO);
    this.ponteiro = new THREE.Vector2();

    if (this.opcoes.interativa) {
      canvas.style.touchAction = 'pan-y';
      canvas.style.cursor = 'grab';
      this._aoPressionar = (e) => this._iniciarArraste(e);
      this._aoMover = (e) => this._moverArraste(e);
      this._aoSoltar = (e) => this._soltarArraste(e);
      canvas.addEventListener('pointerdown', this._aoPressionar);
      window.addEventListener('pointermove', this._aoMover);
      window.addEventListener('pointerup', this._aoSoltar);
      window.addEventListener('pointercancel', this._aoSoltar);
    }

    this._aoMoverMouse = (e) => {
      const r = this.container.getBoundingClientRect();
      this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    window.addEventListener('pointermove', this._aoMoverMouse, { passive: true });

    this.observadorTamanho = new ResizeObserver(() => this._redimensionar());
    this.observadorTamanho.observe(this.container);
    this.observadorVisivel = new IntersectionObserver(([ent]) => {
      this.visivel = ent.isIntersecting;
      if (this.visivel) this._acordar();
    });
    this.observadorVisivel.observe(this.container);
    this._aoMudarAba = () => {
      if (!document.hidden) this._acordar();
    };
    document.addEventListener('visibilitychange', this._aoMudarAba);
  }

  _anguloNoPlano(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    this.raycaster.setFromCamera(this.ponteiro, this.camera);
    const p = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.plano, p)) return null;
    return { ang: Math.atan2(-p.z, p.x), dist: Math.hypot(p.x, p.z) };
  }

  _iniciarArraste(e) {
    const info = this._anguloNoPlano(e);
    this.arrastando = true;
    this.tipoArraste = e.pointerType === 'touch' ? 'toque' : 'mouse';
    this.angAnterior = info?.ang ?? 0;
    this.xAnterior = e.clientX;
    this.tAnterior = performance.now();
    this.velocidade = 0;
    this.renderer.domElement.style.cursor = 'grabbing';
    this.ultimaInteracao = this.relogio.elapsedTime;
    this.opcoes.aoInteragir?.();
    this._acordar();
  }

  _moverArraste(e) {
    if (!this.arrastando) return;
    const agora = performance.now();
    const dt = Math.max(1, agora - this.tAnterior) / 1000;
    let delta;
    if (this.tipoArraste === 'toque') {
      // No celular: deslizar na horizontal gira (vertical rola a página)
      const largura = this.renderer.domElement.clientWidth || 300;
      delta = -((e.clientX - this.xAnterior) / largura) * Math.PI * 1.4;
      this.xAnterior = e.clientX;
    } else {
      const info = this._anguloNoPlano(e);
      if (!info) return;
      delta = Math.atan2(Math.sin(info.ang - this.angAnterior), Math.cos(info.ang - this.angAnterior));
      this.angAnterior = info.ang;
    }
    this.rot += delta;
    this.rotAlvo = this.rot;
    this.velocidade = THREE.MathUtils.lerp(this.velocidade, delta / dt, 0.5);
    this.tAnterior = agora;
    this.ultimaInteracao = this.relogio.elapsedTime;
  }

  _soltarArraste() {
    if (!this.arrastando) return;
    this.arrastando = false;
    this.renderer.domElement.style.cursor = 'grab';
    this.inercia = true;
    this.ultimaInteracao = this.relogio.elapsedTime;
  }

  /* ---------------- API pública ---------------- */
  /** Gira o disco até o ângulo (graus) pelo caminho mais curto. */
  setAngulo(graus, { animar = true } = {}) {
    const alvo = -radDe(graus);
    const atual = this.rot;
    const diff = Math.atan2(Math.sin(alvo - atual), Math.cos(alvo - atual));
    this.rotAlvo = atual + diff;
    this.inercia = false;
    if (!animar || this.reduzir) {
      this.rot = this.rotAlvo;
      this.velocidade = 0;
    }
    this._acordar();
  }

  /** Ângulo (graus, 0–359) que está sob a janela agora. */
  getAngulo() {
    return Math.round(normalizarGraus(-grausDe(this.rot)));
  }

  setVista(nome) {
    this.vista = VISTAS[nome] || VISTAS.geral;
    this.camPos.set(...this.vista.pos);
    this.camAlvo.set(...this.vista.alvo);
    this._acordar();
  }

  /** Destaque visual: null | 'base' | 'disco' | 'janela' | 'quadrantes' | 'eixos'. */
  setDestaque(nome) {
    this.destaque = nome;
    this._acordar();
  }

  setDemo(ligado) {
    this.opcoes.demo = ligado;
    this.proximaDemo = this.relogio.elapsedTime + 1.5;
    this._acordar();
  }

  /** Efeito de comemoração (mini-jogo). */
  comemorar() {
    this.pulso = 1;
    this._acordar();
  }

  _acordar() {
    if (!this.quadro && this.ativo && this.prontoParaAnimar) {
      this.relogio.getDelta();
      this.quadro = requestAnimationFrame(this._loop);
    }
  }

  _redimensionar() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    // Em telas estreitas (retrato), afasta a câmera para caber a roleta inteira
    this.camera.fov = w / h < 0.9 ? 46 : 36;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.bloom?.setSize(Math.max(128, w / 2), Math.max(128, h / 2));
    this._acordar();
  }

  /* ---------------- Animação ---------------- */
  _loop() {
    this.quadro = null;
    if (!this.ativo) return;
    if (!this.visivel || document.hidden) return; // pausa fora da tela
    const dt = Math.min(this.relogio.getDelta(), 0.05);
    const t = this.relogio.elapsedTime;

    // Física do disco
    if (!this.arrastando) {
      if (this.inercia) {
        this.rot += this.velocidade * dt;
        this.velocidade *= Math.exp(-2.6 * dt);
        if (Math.abs(this.velocidade) < 0.6) {
          this.inercia = false;
          const proximo = anguloNotavelMaisProximo(-grausDe(this.rot));
          this.setAngulo(proximo.graus);
        }
      } else {
        // Mola criticamente amortecida até o alvo
        const k = 38;
        const c = 2 * Math.sqrt(k);
        const aceleracao = (this.rotAlvo - this.rot) * k - this.velocidade * c;
        this.velocidade += aceleracao * dt;
        this.rot += this.velocidade * dt;
      }
    }
    this.disco.rotation.y = this.rot;

    // Demonstração automática quando ninguém mexe
    if (this.opcoes.demo && !this.reduzir && !this.arrastando && t - this.ultimaInteracao > 5 && t > this.proximaDemo) {
      this.setAngulo(SEQUENCIA_DEMO[this.indiceDemo % SEQUENCIA_DEMO.length]);
      this.indiceDemo++;
      this.proximaDemo = t + 2.6;
    }

    // Avisa a interface quando o ângulo sob a janela muda
    const grau = this.getAngulo();
    if (grau !== this.ultimoGrau) {
      this.ultimoGrau = grau;
      this.opcoes.aoMudarAngulo?.(grau);
    }

    // Câmera: aproxima suavemente da vista + leve paralaxe do mouse
    const parallax = this.reduzir ? 0 : 0.35;
    const desejada = this.camPos.clone().add(new THREE.Vector3(this.mouse.x * parallax, this.mouse.y * parallax * 0.6, 0));
    const lambda = 2.4;
    this.camera.position.set(
      amortecer(this.camera.position.x, desejada.x, lambda, dt),
      amortecer(this.camera.position.y, desejada.y, lambda, dt),
      amortecer(this.camera.position.z, desejada.z, lambda, dt),
    );
    this.alvoAtual.set(
      amortecer(this.alvoAtual.x, this.camAlvo.x, lambda, dt),
      amortecer(this.alvoAtual.y, this.camAlvo.y, lambda, dt),
      amortecer(this.alvoAtual.z, this.camAlvo.z, lambda, dt),
    );
    this.camera.lookAt(this.alvoAtual);

    // Destaques (com pulsação)
    const onda = 0.5 + 0.5 * Math.sin(t * 4);
    const alvoInt = (nome) => (this.destaque === nome ? 1 : 0);
    for (const nome of Object.keys(this.intensidades)) {
      this.intensidades[nome] = amortecer(this.intensidades[nome], alvoInt(nome), 5, dt);
    }
    const I = this.intensidades;
    this.matBase.emissiveIntensity = I.base * (0.12 + 0.12 * onda);
    this.matBordaDisco.emissiveIntensity = I.disco * (0.4 + 0.4 * onda);
    this.matDisco.emissiveIntensity = I.disco * 0.06 * onda;
    this.matBraco.emissiveIntensity = I.janela * (0.25 + 0.25 * onda);
    this.matVidro.opacity = 0.08 + I.janela * 0.1 * onda;
    this.matContorno.opacity = 0.75 + 0.25 * (I.janela ? onda : 0.4);
    this.quadrantes.forEach((q) => (q.material.opacity = I.quadrantes * 0.42));
    this.marcasEixo.forEach((m) => (m.material.opacity = I.eixos * (0.6 + 0.4 * onda)));

    // Comemoração
    this.pulso = Math.max(0, this.pulso - dt * 1.4);
    const escalaAnel = 1 + this.pulso * 0.12 * Math.sin(this.pulso * 12);
    this.anel.scale.set(escalaAnel, 1, escalaAnel);
    this.matAnel.color.copy(AMBAR).multiplyScalar(1.7 + this.pulso * 4);

    // Onda senoidal e partículas
    if (!this.reduzir || !this._ondaFeita) {
      const pos = this.onda.geometry.attributes.position.array;
      for (let i = 0; i < this.nOnda; i++) {
        const a = (i / this.nOnda) * Math.PI * 2;
        const raio = R + 0.55;
        pos[i * 3] = Math.cos(a) * raio;
        pos[i * 3 + 1] = Y_DISCO + 0.05 + Math.sin(a * 6 + t * 1.6) * 0.09;
        pos[i * 3 + 2] = Math.sin(a) * raio;
      }
      this.onda.geometry.attributes.position.needsUpdate = true;
      this._ondaFeita = true;
    }
    if (!this.reduzir) {
      this.particulas.rotation.y = t * 0.03;
      this.particulas.position.y = Math.sin(t * 0.4) * 0.12;
    }

    if (this.usarBloom) this.composer.render();
    else this.renderer.render(this.cena, this.camera);

    // Continua animando enquanto algo se mexe; senão, dorme até a próxima interação
    const parado =
      this.reduzir &&
      !this.arrastando &&
      !this.inercia &&
      Math.abs(this.rotAlvo - this.rot) < 0.0005 &&
      this.pulso === 0;
    if (!parado) this.quadro = requestAnimationFrame(this._loop);
  }

  /* ---------------- Limpeza ---------------- */
  dispose() {
    this.ativo = false;
    cancelAnimationFrame(this.quadro);
    const canvas = this.renderer.domElement;
    if (this._aoPressionar) {
      canvas.removeEventListener('pointerdown', this._aoPressionar);
      window.removeEventListener('pointermove', this._aoMover);
      window.removeEventListener('pointerup', this._aoSoltar);
      window.removeEventListener('pointercancel', this._aoSoltar);
    }
    window.removeEventListener('pointermove', this._aoMoverMouse);
    document.removeEventListener('visibilitychange', this._aoMudarAba);
    this.observadorTamanho.disconnect();
    this.observadorVisivel.disconnect();
    for (const d of this.descartaveis) d.dispose?.();
    this.composer?.dispose();
    this.renderer.dispose();
    canvas.remove();
  }
}
