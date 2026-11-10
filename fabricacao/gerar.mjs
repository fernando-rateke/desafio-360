/**
 * Gera os arquivos de fabricação da roleta trigonométrica:
 *   - SVG de cada peça e chapas prontas para a mesa do laser (cores = camadas)
 *   - DXF de cada peça (camadas CORTE, MARCAR, GRAVAR)
 *   - STL montado e explodido (modelo 3D)
 *   - dados.json para a página 3D do site (/fabricacao)
 *
 * Uso: npm run fabricacao
 * Coordenadas internas em mm, com y para CIMA e (0,0) no centro da peça.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import QRCode from 'qrcode';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { PARAMETROS as P } from './parametros.js';
import { ANGULOS_NOTAVEIS } from '../src/logica/angulos.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(AQUI, '..', 'public', 'fabricacao');

/* ------------------------------------------------------------------ */
/* Fontes e texto em contornos                                          */
/* ------------------------------------------------------------------ */
function carregarFonte(nome) {
  const b = fs.readFileSync(path.join(AQUI, 'fontes', nome));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const FONTES = {
  semi: carregarFonte('Inter-SemiBold.otf'),
  negrito: carregarFonte('Inter-Bold.otf'),
  reserva: carregarFonte('DejaVuSans-Bold.ttf'), // para símbolos que a Inter não tem (∄)
};

/** Achata curvas Bézier em segmentos (tolerância ~0,04 mm). */
function achatarComandos(comandos, passos) {
  const contornos = [];
  let atual = null;
  let px = 0;
  let py = 0;
  for (const c of comandos) {
    if (c.type === 'M') {
      if (atual && atual.length > 2) contornos.push(atual);
      atual = [[c.x, c.y]];
      [px, py] = [c.x, c.y];
    } else if (c.type === 'L') {
      atual.push([c.x, c.y]);
      [px, py] = [c.x, c.y];
    } else if (c.type === 'Q') {
      for (let i = 1; i <= passos; i++) {
        const t = i / passos;
        const u = 1 - t;
        atual.push([u * u * px + 2 * u * t * c.x1 + t * t * c.x, u * u * py + 2 * u * t * c.y1 + t * t * c.y]);
      }
      [px, py] = [c.x, c.y];
    } else if (c.type === 'C') {
      for (let i = 1; i <= passos; i++) {
        const t = i / passos;
        const u = 1 - t;
        atual.push([
          u * u * u * px + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          u * u * u * py + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y,
        ]);
      }
      [px, py] = [c.x, c.y];
    } else if (c.type === 'Z') {
      if (atual && atual.length > 2) contornos.push(atual);
      atual = null;
    }
  }
  if (atual && atual.length > 2) contornos.push(atual);
  return contornos;
}

/**
 * Texto como contornos fechados (para gravar).
 * @param {string} str
 * @param {{ x?: number, y?: number, altura: number, ang?: number, ancora?: 'inicio'|'meio'|'fim', fonte?: string, espaco?: number }} o
 *   altura = altura das maiúsculas (mm); ang em graus; (x, y) = ponto de ancoragem no meio da altura das maiúsculas
 */
function texto(str, { x = 0, y = 0, altura, ang = 0, ancora = 'inicio', fonte = 'semi', espaco = 0 }) {
  const principal = FONTES[fonte];
  const cap = (principal.tables.os2.sCapHeight || principal.unitsPerEm * 0.73) / principal.unitsPerEm;
  const tamanho = altura / cap;
  const contornos = [];
  let avanco = 0;
  for (const ch of str) {
    const f = principal.charToGlyphIndex(ch) > 0 ? principal : FONTES.reserva;
    const glifo = f.charToGlyph(ch);
    const caminho = glifo.getPath(avanco, 0, tamanho);
    const passos = Math.max(4, Math.ceil(tamanho / 1.2));
    for (const c of achatarComandos(caminho.commands, passos)) contornos.push(c.map(([a, b]) => [a, -b]));
    avanco += (glifo.advanceWidth / f.unitsPerEm) * tamanho + espaco;
  }
  const largura = avanco - espaco;
  const dx = ancora === 'meio' ? -largura / 2 : ancora === 'fim' ? -largura : 0;
  const dy = -altura / 2;
  const r = (ang * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return contornos.map((c) =>
    c.map(([a, b]) => {
      const lx = a + dx;
      const ly = b + dy;
      return [x + lx * cos - ly * sin, y + lx * sin + ly * cos];
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Geometria básica                                                     */
/* ------------------------------------------------------------------ */
const rad = (g) => (g * Math.PI) / 180;
const polar = (r, gr) => [r * Math.cos(rad(gr)), r * Math.sin(rad(gr))];

function circulo(cx, cy, r, segmentos) {
  const n = segmentos || Math.max(48, Math.ceil((2 * Math.PI * r) / 0.6));
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

/** Arco de (cx,cy,r) do ângulo a0 ao a1 (radianos, sentido dado pelo sinal de a1-a0). */
function arco(cx, cy, r, a0, a1, passoMm = 0.5) {
  const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / passoMm));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

function retanguloArredondado(x0, y0, x1, y1, r) {
  const pts = [];
  pts.push(...arco(x1 - r, y0 + r, r, -Math.PI / 2, 0));
  pts.push(...arco(x1 - r, y1 - r, r, 0, Math.PI / 2));
  pts.push(...arco(x0 + r, y1 - r, r, Math.PI / 2, Math.PI));
  pts.push(...arco(x0 + r, y0 + r, r, Math.PI, (3 * Math.PI) / 2));
  return pts;
}

/**
 * Círculo de raio R com "mordidas" circulares de raio rn centradas sobre a borda.
 * para dentro = ranhuras (disco); para fora = recortes de dedo (moldura).
 */
function circuloComMordidas(R, angulosGraus, rn, paraDentro) {
  const delta = Math.acos(1 - (rn * rn) / (2 * R * R)); // meia-abertura na borda principal
  const angs = [...angulosGraus].map(rad).sort((a, b) => a - b);
  const pts = [];
  angs.forEach((a, i) => {
    const prox = i + 1 < angs.length ? angs[i + 1] : angs[0] + Math.PI * 2;
    const [cx, cy] = [R * Math.cos(a), R * Math.sin(a)];
    const p1 = [R * Math.cos(a - delta), R * Math.sin(a - delta)];
    const p2 = [R * Math.cos(a + delta), R * Math.sin(a + delta)];
    let b1 = Math.atan2(p1[1] - cy, p1[0] - cx);
    let b2 = Math.atan2(p2[1] - cy, p2[0] - cx);
    // Para dentro: passa pelo ponto mais próximo do centro (ângulo a+π); para fora: pelo mais distante (a)
    const meio = paraDentro ? a + Math.PI : a;
    // Ajusta b2 para que o arco de b1 a b2 passe por "meio"
    const norm = (v) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const ccwB2 = b1 + norm(b2 - b1);
    const passaCcw = norm(meio - b1) < norm(b2 - b1);
    b2 = passaCcw ? ccwB2 : ccwB2 - 2 * Math.PI;
    pts.push(...arco(cx, cy, rn, b1, b2, 0.15));
    pts.push(...arco(0, 0, R, a + delta, prox - delta, 0.6).slice(1, -1));
  });
  return pts;
}

/* ------------------------------------------------------------------ */
/* Peças                                                                */
/* ------------------------------------------------------------------ */
/**
 * Cada peça: { id, nome, quantidade, z (posição na montagem), cortes: [contornos], marcar: [linhas], gravar: [contornos] }
 * cortes[0] é o contorno externo; os demais são furos/janelas.
 */
const pecas = [];
const L = P.lado / 2;
const T = P.espessura;

/* ---------- 1. Base ---------- */
{
  const marcar = [circulo(0, 0, P.raioEixo, 96), [[-P.raioEixo - 4, 0], [P.raioEixo + 4, 0]], [[0, -P.raioEixo - 4], [0, P.raioEixo + 4]]];
  pecas.push({
    id: 'base',
    nome: 'Base',
    descricao: 'Fica embaixo de tudo. O círculo marcado no centro é onde o eixo é colado.',
    quantidade: 1,
    z: 0,
    cortes: [retanguloArredondado(-L, -L, L, L, P.raioCanto)],
    marcar,
    gravar: [
      ...texto('COLE O EIXO AQUI', { y: -P.raioEixo - 8, altura: 2.6, ancora: 'meio' }),
      ...texto('DESAFIO 360 · BASE', { y: -L + 14, altura: 4, ancora: 'meio', fonte: 'negrito' }),
    ],
  });
}

/* ---------- 2. Moldura ---------- */
{
  const rFuro = P.raioDisco + P.folgaDisco;
  const gravar = [
    ...texto('ROLETA TRIGONOMÉTRICA', { y: L - 8.2, altura: 3.8, ancora: 'meio', fonte: 'negrito', espaco: 0.35 }),
    ...texto('DESAFIO 360  ·  0° A 360°', { y: -L + 8.2, altura: 3.8, ancora: 'meio', fonte: 'negrito', espaco: 0.35 }),
  ];
  [['I', 45], ['II', 135], ['III', 225], ['IV', 315]].forEach(([n, a]) => {
    const [x, y] = polar(141, a);
    gravar.push(...texto(n, { x, y, altura: 8, ancora: 'meio', fonte: 'negrito' }));
  });
  // Seta no lado da janela (0°)
  gravar.push([[rFuro + 2, 0], [rFuro + 8, 3.2], [rFuro + 8, -3.2]]);
  const { meiaLargura, alcance } = P.lingueta;
  const xi = -(rFuro + 0.4); // borda do furo, já sobre o MDF
  const marcar = [[[-alcance, meiaLargura], [xi, meiaLargura], [xi, -meiaLargura], [-alcance, -meiaLargura], [-alcance, meiaLargura]]];
  pecas.push({
    id: 'moldura',
    nome: 'Moldura',
    descricao: 'Colada sobre a base. O disco gira dentro do furo; os recortes deixam o dedo alcançar a borda.',
    quantidade: 1,
    z: T,
    cortes: [retanguloArredondado(-L, -L, L, L, P.raioCanto), circuloComMordidas(rFuro, P.recortesDedo, P.raioRecorteDedo, false)],
    marcar,
    gravar,
  });
}

/* ---------- 3. Disco giratório ---------- */
{
  const R = P.raioDisco;
  const passoRanhura = 360 / P.ranhuras;
  const contorno = circuloComMordidas(R, Array.from({ length: P.ranhuras }, (_, i) => i * passoRanhura + passoRanhura / 2), P.raioRanhura, true);
  const marcar = [circulo(0, 0, 100.4, 360), circulo(0, 0, 84.2, 300), circulo(0, 0, 41.5, 200)];
  const gravar = [];
  const lista = ANGULOS_NOTAVEIS.map((a) => a.graus);
  lista.forEach((g, i) => {
    const prox = i + 1 < lista.length ? lista[i + 1] : 360;
    const meio = (g + prox) / 2;
    marcar.push([polar(41.5, meio), polar(100.4, meio)]); // separadores
  });
  for (const a of ANGULOS_NOTAVEIS) {
    const g = a.graus;
    const linhaRadial = (r, dy) => {
      // ponto a uma distância r ao longo do raio do ângulo g, deslocado dy na perpendicular
      const [x, y] = polar(r, g);
      const [px, py] = polar(dy, g + 90);
      return [x + px, y + py];
    };
    // Marca no aro
    marcar.push([polar(100.4, g), polar(102.4, g)]);
    // Faixa externa (sempre visível): graus e radianos
    let [x, y] = linhaRadial(86.5, 2.5);
    gravar.push(...texto(`${g}°`, { x, y, altura: 3.8, ang: g, fonte: 'negrito' }));
    [x, y] = linhaRadial(86.5, -2.9);
    gravar.push(...texto(a.radianos === '0' ? '0 rad' : a.radianos, { x, y, altura: 2.7, ang: g }));
    // Faixa interna (aparece só na janela): sen, cos, tg + graus em destaque
    [x, y] = linhaRadial(45, 3.7);
    gravar.push(...texto(a.sen, { x, y, altura: 2.5, ang: g }));
    [x, y] = linhaRadial(45, 0);
    gravar.push(...texto(a.cos, { x, y, altura: 2.5, ang: g }));
    [x, y] = linhaRadial(45, -3.7);
    // "∄" gravado fica ilegível nesse tamanho; no jogo a resposta é "não existe"
    if (a.tg === '∄') gravar.push(...texto('não existe', { x, y, altura: 2.1, ang: g }));
    else gravar.push(...texto(a.tg, { x, y, altura: 2.5, ang: g }));
    [x, y] = linhaRadial(61, 0);
    gravar.push(...texto(`${g}°`, { x, y, altura: 5, ang: g, fonte: 'negrito' }));
  }
  pecas.push({
    id: 'disco',
    nome: 'Disco giratório',
    descricao: 'Gira em volta do eixo. A borda mostra os 16 ângulos; os valores ficam escondidos pela máscara e aparecem na janela.',
    quantidade: 1,
    z: T,
    cortes: [contorno, circulo(0, 0, P.raioEixo + P.folgaEixo, 128)],
    marcar,
    gravar,
  });
}

/* ---------- 4. Máscara com janela ---------- */
{
  const R = P.raioMascara;
  const { meiaLargura: w, alcance } = P.lingueta;
  const { meiaBase: nb, ponta } = P.ponteiro;
  const dT = Math.asin(w / R);
  const dN = Math.asin(nb / R);
  const contorno = [
    [ponta, 0],
    ...arco(0, 0, R, dN, Math.PI - dT, 0.5),
    ...arco(-alcance + 2, w - 2, 2, Math.PI / 2, Math.PI, 0.3),
    ...arco(-alcance + 2, -w + 2, 2, Math.PI, 1.5 * Math.PI, 0.3),
    [-R * Math.cos(dT), -w],
    ...arco(0, 0, R, Math.PI + dT, 2 * Math.PI - dN, 0.5),
  ];
  const J = P.janela;
  const janela = retanguloArredondado(J.r0, -J.meiaAltura, J.r1, J.meiaAltura, J.raioCanto);

  const gravar = [
    ...texto('DESAFIO 360', { y: 57, altura: 7, ancora: 'meio', fonte: 'negrito', espaco: 0.4 }),
    ...texto('GIRE O DISCO · LEIA NA JANELA', { y: 47, altura: 2.6, ancora: 'meio', espaco: 0.25 }),
    ...texto('sen', { x: 39.5, y: 3.7, altura: 2.5, ancora: 'fim' }),
    ...texto('cos', { x: 39.5, y: 0, altura: 2.5, ancora: 'fim' }),
    ...texto('tg', { x: 39.5, y: -3.7, altura: 2.5, ancora: 'fim' }),
    ...texto('JANELA', { x: (J.r0 + J.r1) / 2, y: J.meiaAltura + 3.4, altura: 2.2, ancora: 'meio', espaco: 0.3 }),
    ...texto('sinais', { x: 6, y: -33, altura: 2.6, ancora: 'meio', fonte: 'negrito' }),
  ];
  // Tabelinha de sinais por quadrante
  const colunas = [-14, 0, 14, 28];
  ['I', 'II', 'III', 'IV'].forEach((q, i) => gravar.push(...texto(q, { x: colunas[i] - 2, y: -40, altura: 2.6, ancora: 'meio', fonte: 'negrito' })));
  const sinais = { sen: ['+', '+', '−', '−'], cos: ['+', '−', '−', '+'], tg: ['+', '−', '+', '−'] };
  Object.entries(sinais).forEach(([f, s], linha) => {
    const y = -46.5 - linha * 6;
    gravar.push(...texto(f, { x: -21, y, altura: 2.6, ancora: 'fim' }));
    s.forEach((sinal, i) => gravar.push(...texto(sinal, { x: colunas[i] - 2, y, altura: 3, ancora: 'meio', fonte: 'negrito' })));
  });
  gravar.push(...texto('tg não existe em 90° e 270°', { x: 3, y: -67, altura: 2.2, ancora: 'meio' }));

  // QR Code (módulos agrupados por linha)
  const qr = QRCode.create(P.urlQr, { errorCorrectionLevel: 'L' });
  const n = qr.modules.size;
  const m = P.tamanhoQr / n;
  const x0 = -78;
  const y0 = P.tamanhoQr / 2;
  for (let lin = 0; lin < n; lin++) {
    let col = 0;
    while (col < n) {
      if (!qr.modules.get(lin, col)) {
        col++;
        continue;
      }
      const ini = col;
      while (col < n && qr.modules.get(lin, col)) col++;
      const xa = x0 + ini * m;
      const xb = x0 + col * m;
      const ya = y0 - lin * m;
      const yb = ya - m;
      gravar.push([[xa, ya], [xb, ya], [xb, yb], [xa, yb]]);
    }
  }
  gravar.push(...texto('ENTRE NO JOGO', { x: x0 + P.tamanhoQr / 2, y: -y0 - 4, altura: 2.2, ancora: 'meio', espaco: 0.25 }));

  pecas.push({
    id: 'mascara',
    nome: 'Máscara com janela',
    descricao: 'Fica fixa por cima do disco (colada no eixo e na moldura). Só o ângulo escolhido aparece pela janela.',
    quantidade: 1,
    z: 2 * T,
    cortes: [contorno, janela],
    marcar: [],
    gravar,
    qrModulos: n,
  });
}

/* ---------- 5. Eixo ---------- */
pecas.push({
  id: 'eixo',
  nome: 'Eixo',
  descricao: 'Círculo colado no centro da base. O disco gira em volta dele e a máscara é colada em cima.',
  quantidade: 1,
  z: T,
  cortes: [circulo(0, 0, P.raioEixo, 128)],
  marcar: [],
  gravar: [],
});

/* ------------------------------------------------------------------ */
/* Saída: SVG, DXF, JSON, STL                                           */
/* ------------------------------------------------------------------ */
const CORES = { corte: '#FF0000', marcar: '#0000FF', gravar: '#000000' };
const fmt = (v) => (Math.round(v * 1000) / 1000).toString();

function caixa(peca) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of peca.cortes[0]) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Caminho SVG de contornos, com deslocamento (ox, oy) e y invertido. */
function caminhoSvg(contornos, ox, oy, fechar = true) {
  return contornos
    .map((c) => 'M' + c.map(([x, y]) => `${fmt(x + ox)} ${fmt(oy - y)}`).join('L') + (fechar ? 'Z' : ''))
    .join('');
}

function gruposSvg(peca, ox, oy) {
  return [
    `<g id="GRAVAR-${peca.id}" fill="${CORES.gravar}" fill-rule="nonzero" stroke="none"><path d="${caminhoSvg(peca.gravar, ox, oy)}"/></g>`,
    `<g id="MARCAR-${peca.id}" fill="none" stroke="${CORES.marcar}" stroke-width="0.1">${peca.marcar
      .map((l) => {
        const fechada = l.length > 3;
        return `<path d="${caminhoSvg([l], ox, oy, fechada)}"/>`;
      })
      .join('')}</g>`,
    `<g id="CORTE-${peca.id}" fill="none" stroke="${CORES.corte}" stroke-width="0.1">${peca.cortes
      .map((c) => `<path d="${caminhoSvg([c], ox, oy)}"/>`)
      .join('')}</g>`,
  ].join('\n');
}

function svgDocumento(largura, altura, conteudo, titulo) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${titulo} — Desafio 360. Unidades em mm. VERMELHO = cortar, AZUL = marcar (vetor, baixa potência), PRETO = gravar (preenchimento). -->
<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(largura)}mm" height="${fmt(altura)}mm" viewBox="0 0 ${fmt(largura)} ${fmt(altura)}">
<title>${titulo}</title>
${conteudo}
</svg>
`;
}

function dxf(peca) {
  const { x0, y0 } = caixa(peca);
  const ox = -x0; // origem no canto inferior esquerdo, y para cima
  const oy = -y0;
  const linhas = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC'];
  linhas.push('0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '3');
  for (const [nome, cor] of [['CORTE', 1], ['MARCAR', 5], ['GRAVAR', 7]]) {
    linhas.push('0', 'LAYER', '2', nome, '70', '0', '62', String(cor), '6', 'CONTINUOUS');
  }
  linhas.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  const polilinha = (camada, pts, fechada) => {
    linhas.push('0', 'POLYLINE', '8', camada, '66', '1', '70', fechada ? '1' : '0', '10', '0', '20', '0', '30', '0');
    for (const [x, y] of pts) linhas.push('0', 'VERTEX', '8', camada, '10', fmt(x + ox), '20', fmt(y + oy), '30', '0');
    linhas.push('0', 'SEQEND', '8', camada);
  };
  peca.gravar.forEach((c) => polilinha('GRAVAR', c, true));
  peca.marcar.forEach((l) => polilinha('MARCAR', l, l.length > 3));
  peca.cortes.forEach((c) => polilinha('CORTE', c, true));
  linhas.push('0', 'ENDSEC', '0', 'EOF');
  return linhas.join('\n') + '\n';
}

/** Distribui as peças em chapas do tamanho da mesa (prateleiras). */
function montarChapas() {
  const { largura, altura, margem, espaco } = P.mesa;
  const itens = [];
  for (const p of pecas) for (let i = 0; i < p.quantidade; i++) itens.push(p);
  itens.push(pecas.find((p) => p.id === 'eixo')); // um eixo reserva
  itens.sort((a, b) => caixa(b).h - caixa(a).h);
  const chapas = [];
  let chapa = null;
  let x = 0;
  let y = 0;
  let alturaLinha = 0;
  for (const p of itens) {
    const c = caixa(p);
    if (c.w > largura - 2 * margem || c.h > altura - 2 * margem) {
      throw new Error(`A peça "${p.nome}" (${c.w.toFixed(0)}×${c.h.toFixed(0)} mm) não cabe na mesa ${largura}×${altura}.`);
    }
    if (!chapa || x + c.w > largura - margem) {
      x = margem;
      y += alturaLinha + (chapa ? espaco : 0);
      alturaLinha = 0;
    }
    if (!chapa || y + c.h > altura - margem) {
      chapa = [];
      chapas.push(chapa);
      x = margem;
      y = margem;
      alturaLinha = 0;
    }
    chapa.push({ peca: p, x: x - c.x0, y: y + c.y1 });
    x += c.w + espaco;
    alturaLinha = Math.max(alturaLinha, c.h);
  }
  return chapas;
}

/* ---------- 3D ---------- */
function formaThree(contornos) {
  const [externo, ...furos] = contornos;
  const forma = new THREE.Shape(externo.map(([x, y]) => new THREE.Vector2(x, y)));
  forma.holes = furos.map((f) => new THREE.Path(f.map(([x, y]) => new THREE.Vector2(x, y))));
  return forma;
}

function malhaDaPeca(peca, z) {
  const geo = new THREE.ExtrudeGeometry(formaThree(peca.cortes), { depth: T, bevelEnabled: false, curveSegments: 1 });
  const m = new THREE.Mesh(geo);
  m.position.z = z;
  return m;
}

function stl(explodido) {
  const grupo = new THREE.Group();
  const passo = explodido ? 18 : 0;
  const nivel = { base: 0, moldura: 1, eixo: 1, disco: 1.6, mascara: 2.6 };
  for (const p of pecas) {
    const extra = explodido ? nivel[p.id] * passo : 0;
    grupo.add(malhaDaPeca(p, p.z + extra));
  }
  grupo.updateMatrixWorld(true);
  return new STLExporter().parse(grupo, { binary: true });
}

/* ---------- Escrever tudo ---------- */
fs.rmSync(SAIDA, { recursive: true, force: true });
for (const d of ['pecas', 'chapas', 'dxf', '3d']) fs.mkdirSync(path.join(SAIDA, d), { recursive: true });

const resumoPecas = [];
pecas.forEach((p, i) => {
  const c = caixa(p);
  const nomeArq = `${i + 1}-${p.id}`;
  fs.writeFileSync(path.join(SAIDA, 'pecas', `${nomeArq}.svg`), svgDocumento(c.w, c.h, gruposSvg(p, -c.x0, c.y1), p.nome));
  fs.writeFileSync(path.join(SAIDA, 'dxf', `${nomeArq}.dxf`), dxf(p));
  resumoPecas.push({ ...p, arquivo: nomeArq, largura: +c.w.toFixed(1), altura: +c.h.toFixed(1) });
});

const chapas = montarChapas();
chapas.forEach((itens, i) => {
  const conteudo = itens.map(({ peca, x, y }) => gruposSvg(peca, x, y)).join('\n');
  const contornoMesa = `<rect x="0" y="0" width="${P.mesa.largura}" height="${P.mesa.altura}" fill="none" stroke="#00AA00" stroke-width="0.2" stroke-dasharray="4 3"/>`;
  fs.writeFileSync(
    path.join(SAIDA, 'chapas', `chapa-${i + 1}.svg`),
    svgDocumento(P.mesa.largura, P.mesa.altura, `<!-- VERDE tracejado = limite da mesa (não cortar; apague antes de enviar) -->\n${contornoMesa}\n${conteudo}`, `Chapa ${i + 1}`),
  );
});

fs.writeFileSync(path.join(SAIDA, '3d', 'roleta-montada.stl'), Buffer.from(stl(false).buffer));
fs.writeFileSync(path.join(SAIDA, '3d', 'roleta-explodida.stl'), Buffer.from(stl(true).buffer));

// Dados para a página 3D (coordenadas arredondadas)
const r2 = (c) => c.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
const dados = {
  parametros: P,
  chapas: chapas.map((itens) => itens.map(({ peca }) => peca.id)),
  pecas: resumoPecas.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    quantidade: p.quantidade,
    arquivo: p.arquivo,
    largura: p.largura,
    altura: p.altura,
    z: p.z,
    cortes: p.cortes.map(r2),
    marcar: p.marcar.map(r2),
    gravar: p.gravar.map(r2),
  })),
};
fs.writeFileSync(path.join(SAIDA, 'dados.json'), JSON.stringify(dados));

console.log(`Peças: ${pecas.length} · Chapas (${P.mesa.largura}×${P.mesa.altura}): ${chapas.length}`);
for (const p of resumoPecas) console.log(`  ${p.arquivo}: ${p.largura} × ${p.altura} mm · ${p.gravar.length} contornos gravados`);
const qr = pecas.find((p) => p.id === 'mascara').qrModulos;
console.log(`QR Code: ${qr}×${qr} módulos de ${(P.tamanhoQr / qr).toFixed(2)} mm`);
console.log('Saída em', path.relative(process.cwd(), SAIDA));
