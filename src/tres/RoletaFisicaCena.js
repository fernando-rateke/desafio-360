/**
 * Modelo 3D da roleta FÍSICA, montado a partir dos mesmos contornos dos
 * arquivos de corte (public/fabricacao/dados.json). Mostra cada peça de MDF
 * com a gravação a laser e permite "explodir" a montagem.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { anguloNotavelMaisProximo } from '../logica/angulos.js';

const COR_FUNDO = 0x0b1f26;
const ESCALA = 0.02; // 1 mm = 0,02 unidade da cena

/** Quanto cada peça sobe quando a montagem está explodida (em espessuras). */
const NIVEL_EXPLODIDO = { base: 0, moldura: 7, eixo: 3.5, disco: 12, mascara: 20 };

function caixaContorno(c) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of c) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Desenha a face de cima da peça: MDF + gravação (queimado) + linhas marcadas. */
function texturaPeca(peca, caixa, tamanho) {
  const c = document.createElement('canvas');
  const escala = tamanho / Math.max(caixa.w, caixa.h);
  c.width = Math.ceil(caixa.w * escala);
  c.height = Math.ceil(caixa.h * escala);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, '#d8b081');
  g.addColorStop(1, '#c79a66');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  // Textura sutil do MDF
  for (let i = 0; i < c.width * c.height * 0.004; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90,55,25,0.06)' : 'rgba(255,240,210,0.06)';
    ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }
  const px = (x) => (x - caixa.x0) * escala;
  const py = (y) => (caixa.y1 - y) * escala;

  // Linhas marcadas (vetor, baixa potência)
  ctx.strokeStyle = 'rgba(70,40,15,0.55)';
  ctx.lineWidth = Math.max(1, 0.25 * escala);
  for (const l of peca.marcar) {
    ctx.beginPath();
    l.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
    if (l.length > 3) ctx.closePath();
    ctx.stroke();
  }
  // Gravação (preenchimento queimado)
  ctx.fillStyle = 'rgba(52,28,10,0.92)';
  ctx.beginPath();
  for (const contorno of peca.gravar) {
    contorno.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
    ctx.closePath();
  }
  ctx.fill('nonzero');

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  // UV das tampas do ExtrudeGeometry = coordenadas do contorno (mm)
  tex.repeat.set(1 / caixa.w, 1 / caixa.h);
  tex.offset.set(-caixa.x0 / caixa.w, -caixa.y0 / caixa.h);
  return tex;
}

export class RoletaFisicaCena {
  constructor(container, dados, { aoMudarAngulo } = {}) {
    this.container = container;
    this.dados = dados;
    this.aoMudarAngulo = aoMudarAngulo;
    this.descartaveis = [];
    this.relogio = new THREE.Clock();
    this.explosao = 0;
    this.explosaoAlvo = 0;
    this.rotDisco = 0;
    this.rotDiscoAlvo = 0;
    this.ativo = true;
    this.reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fraco = window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 760;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, fraco ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = !fraco;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(COR_FUNDO, 1);
    this.renderer.domElement.className = 'roleta3d__canvas';
    container.appendChild(this.renderer.domElement);

    this.cena = new THREE.Scene();
    this.cena.background = new THREE.Color(COR_FUNDO);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(3.2, 5.4, 6.2);

    this.controles = new OrbitControls(this.camera, this.renderer.domElement);
    this.controles.enableDamping = true;
    this.controles.target.set(0, 0.4, 0);
    this.controles.minDistance = 3;
    this.controles.maxDistance = 16;
    this.controles.maxPolarAngle = Math.PI * 0.49;
    this.controles.autoRotate = !this.reduzir;
    this.controles.autoRotateSpeed = 0.6;
    this.controles.addEventListener('start', () => (this.controles.autoRotate = false));

    this.cena.add(new THREE.HemisphereLight(0xd6ecff, 0x2a1a0c, 0.9));
    const sol = new THREE.DirectionalLight(0xffe6c4, 2.2);
    sol.position.set(4, 9, 5);
    sol.castShadow = this.renderer.shadowMap.enabled;
    sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
    sol.shadow.bias = -0.0005;
    this.cena.add(sol);
    const contraluz = new THREE.PointLight(0x6cc0c0, 30, 20, 2);
    contraluz.position.set(-5, 3, -4);
    this.cena.add(contraluz);

    // Chão (só recebe sombra)
    const geoChao = new THREE.PlaneGeometry(30, 30);
    geoChao.rotateX(-Math.PI / 2);
    const chao = new THREE.Mesh(geoChao, new THREE.ShadowMaterial({ opacity: 0.35 }));
    chao.position.y = -0.002;
    chao.receiveShadow = true;
    this.cena.add(chao);
    this.descartaveis.push(geoChao, chao.material);

    this._montarPecas();
    this._ligar();
    this._redimensionar();
    this._loop = this._loop.bind(this);
    this.quadro = requestAnimationFrame(this._loop);
  }

  _montarPecas() {
    const T = this.dados.parametros.espessura;
    this.T = T;
    this.malhas = {};
    // Borda queimada pelo laser: mais escura que a face
    const matBorda = new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.9 });
    this.descartaveis.push(matBorda);
    const grupo = new THREE.Group();
    grupo.rotation.x = -Math.PI / 2; // peças deitadas (z da extrusão vira "para cima")
    grupo.scale.setScalar(ESCALA);
    this.cena.add(grupo);
    this.grupo = grupo;

    for (const peca of this.dados.pecas) {
      const [externo, ...furos] = peca.cortes;
      const forma = new THREE.Shape(externo.map(([x, y]) => new THREE.Vector2(x, y)));
      forma.holes = furos.map((f) => new THREE.Path(f.map(([x, y]) => new THREE.Vector2(x, y))));
      const geo = new THREE.ExtrudeGeometry(forma, { depth: T, bevelEnabled: false, curveSegments: 1 });
      const caixa = caixaContorno(externo);
      const tamanhoTex = peca.id === 'disco' || peca.id === 'mascara' ? 2048 : 1024;
      const tex = texturaPeca(peca, caixa, tamanhoTex);
      const matFace = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78 });
      this.descartaveis.push(geo, tex, matFace);
      const malha = new THREE.Mesh(geo, [matFace, matBorda]);
      malha.castShadow = true;
      malha.receiveShadow = true;
      malha.userData = { z: peca.z, nivel: NIVEL_EXPLODIDO[peca.id] ?? 0 };
      malha.position.z = peca.z;
      grupo.add(malha);
      this.malhas[peca.id] = malha;
    }
  }

  _ligar() {
    this.observador = new ResizeObserver(() => this._redimensionar());
    this.observador.observe(this.container);
  }

  _redimensionar() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.9 ? 48 : 35;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  /** 0 = montada, 1 = explodida. */
  setExplosao(v) {
    this.explosaoAlvo = Math.min(1, Math.max(0, v));
  }

  /** Gira o disco até o ângulo (graus) ficar sob a janela (lado direito). */
  setAngulo(graus) {
    const alvo = -THREE.MathUtils.degToRad(graus);
    const diff = Math.atan2(Math.sin(alvo - this.rotDisco), Math.cos(alvo - this.rotDisco));
    this.rotDiscoAlvo = this.rotDisco + diff;
  }

  /** Vistas rápidas da câmera. */
  setVista(nome) {
    const vistas = {
      geral: [3.2, 5.4, 6.2],
      topo: [0.01, 9.5, 0.4],
      lado: [7.5, 1.6, 0.01],
    };
    this.vistaAlvo = new THREE.Vector3(...(vistas[nome] || vistas.geral));
    this.controles.autoRotate = false;
  }

  _loop() {
    if (!this.ativo) return;
    const dt = Math.min(this.relogio.getDelta(), 0.05);
    const k = 1 - Math.exp(-(this.reduzir ? 50 : 5) * dt);
    this.explosao += (this.explosaoAlvo - this.explosao) * k;
    this.rotDisco += (this.rotDiscoAlvo - this.rotDisco) * k;
    for (const m of Object.values(this.malhas)) {
      m.position.z = m.userData.z + m.userData.nivel * this.T * 1.6 * this.explosao;
    }
    this.malhas.disco.rotation.z = this.rotDisco;
    if (this.vistaAlvo) {
      this.camera.position.lerp(this.vistaAlvo, k);
      if (this.camera.position.distanceTo(this.vistaAlvo) < 0.02) this.vistaAlvo = null;
    }
    const grau = Math.round(((-THREE.MathUtils.radToDeg(this.rotDisco) % 360) + 360) % 360);
    if (grau !== this.ultimoGrau) {
      this.ultimoGrau = grau;
      this.aoMudarAngulo?.(anguloNotavelMaisProximo(grau).graus, grau);
    }
    this.controles.update();
    this.renderer.render(this.cena, this.camera);
    this.quadro = requestAnimationFrame(this._loop);
  }

  dispose() {
    this.ativo = false;
    cancelAnimationFrame(this.quadro);
    this.observador.disconnect();
    this.controles.dispose();
    for (const d of this.descartaveis) d.dispose?.();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
