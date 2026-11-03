/**
 * Normalização e comparação de respostas digitadas ("Digitar o valor").
 *
 * Duas etapas:
 *  1. normalizarResposta(): padroniza o TEXTO (espaços, maiúsculas, vírgula,
 *     símbolos √ e π, "raiz de", graus, "não existe"...).
 *  2. avaliarExpressao(): quando o texto é uma expressão numérica simples
 *     (ex.: "raiz(3)/2", "-1/2", "2pi/3", "0.866"), calcula o valor. Assim
 *     √3/2 e 0.866 viram o mesmo número e podem ser comparados com tolerância.
 *
 * Não usamos eval(): o avaliador abaixo só entende números, pi, raiz(),
 * + - * / ^ e parênteses.
 */

/** Diferença máxima aceita entre dois valores numéricos (ex.: 0.87 ≈ √3/2). */
export const TOLERANCIA = 0.005;

/** Formas canônicas de "não existe" (tangente de 90° e 270°, por exemplo). */
export const NAO_EXISTE = 'naoexiste';

const SINONIMOS_NAO_EXISTE = new Set([
  'naoexiste',
  'nexiste',
  'naodefinida',
  'naodefinido',
  'indefinida',
  'indefinido',
  'inexistente',
  'naotem',
  'nao',
  'nd',
  'ne',
  'impossivel',
  'naoha',
]);

/**
 * Padroniza um texto de resposta.
 * @param {unknown} entrada texto digitado (qualquer tipo é convertido para string)
 * @returns {string} resposta normalizada ('' se vazia)
 */
export function normalizarResposta(entrada) {
  if (entrada === null || entrada === undefined) return '';

  // "∄" se decompõe em "∃" + traço ao remover acentos: tratamos antes
  let t = String(entrada).replace(/∄/g, 'naoexiste');

  t = t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (não → nao)
    .toLowerCase()
    .replace(/\s+/g, ''); // remove TODOS os espaços

  // Pontuação e símbolos alternativos
  t = t
    .replace(/,/g, '.')
    .replace(/[−–—]/g, '-') // traços e sinal de menos tipográfico
    .replace(/÷/g, '/')
    .replace(/[×·⋅]/g, '*')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'raiz')
    .replace(/sqrt/g, 'raiz')
    .replace(/raizquadradade|raizquadrada|raizde/g, 'raiz');

  // Unidades: graus e radianos não mudam o valor digitado
  t = t
    .replace(/[°º˚]/g, '')
    .replace(/(graus|grau)$/, '')
    .replace(/(radianos|radiano|rad)$/, '');

  // Sinal de "+" no início é redundante
  t = t.replace(/^\+/, '');

  // raiz3 → raiz(3)  |  raiz(3) continua igual
  t = t.replace(/raiz(\d+(?:\.\d+)?)/g, 'raiz($1)');

  // Números como ".5" → "0.5" e "0.50" → "0.5"
  t = t.replace(/(^|[^\d.])\.(\d)/g, '$10.$2');
  t = t.replace(/(\d+\.\d*?)0+(?!\d)/g, '$1').replace(/(\d+)\.(?!\d)/g, '$1');

  if (SINONIMOS_NAO_EXISTE.has(t) || t.startsWith('naoexist')) {
    return NAO_EXISTE;
  }

  return t;
}

/* ------------------------------------------------------------------ */
/* Avaliador de expressões (descida recursiva)                          */
/* ------------------------------------------------------------------ */

function tokenizar(texto) {
  const tokens = [];
  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    if (/\d|\./.test(c)) {
      let j = i;
      while (j < texto.length && /[\d.]/.test(texto[j])) j++;
      const numero = texto.slice(i, j);
      if (!/^\d*\.?\d+$|^\d+\.?$/.test(numero)) return null;
      tokens.push({ tipo: 'num', valor: parseFloat(numero) });
      i = j;
    } else if (texto.startsWith('pi', i)) {
      tokens.push({ tipo: 'num', valor: Math.PI });
      i += 2;
    } else if (texto.startsWith('raiz', i)) {
      tokens.push({ tipo: 'raiz' });
      i += 4;
    } else if ('+-*/^()'.includes(c)) {
      tokens.push({ tipo: c });
      i++;
    } else {
      return null; // caractere desconhecido → não é expressão numérica
    }
  }
  return tokens;
}

/**
 * Calcula o valor numérico de uma resposta normalizada.
 * Aceita multiplicação implícita: "2pi", "3raiz(2)", "2(1+1)".
 * @param {string} texto resposta JÁ normalizada
 * @returns {number|null} valor, ou null se não for uma expressão válida
 */
export function avaliarExpressao(texto) {
  if (!texto) return null;
  const tokens = tokenizar(texto);
  if (!tokens || tokens.length === 0) return null;

  let pos = 0;
  const atual = () => tokens[pos];
  const consumir = (tipo) => {
    if (atual() && atual().tipo === tipo) {
      pos++;
      return true;
    }
    return false;
  };

  // expressao := termo (('+' | '-') termo)*
  function expressao() {
    let valor = termo();
    while (atual() && (atual().tipo === '+' || atual().tipo === '-')) {
      const op = tokens[pos++].tipo;
      const direita = termo();
      valor = op === '+' ? valor + direita : valor - direita;
    }
    return valor;
  }

  // termo := unario (('*' | '/' | implícito) unario)*
  function termo() {
    let valor = unario();
    for (;;) {
      const t = atual();
      if (!t) break;
      if (t.tipo === '*' || t.tipo === '/') {
        pos++;
        const direita = unario();
        valor = t.tipo === '*' ? valor * direita : valor / direita;
      } else if (t.tipo === 'num' || t.tipo === 'raiz' || t.tipo === '(') {
        valor *= potencia(); // multiplicação implícita
      } else {
        break;
      }
    }
    return valor;
  }

  // unario := '-' unario | potencia
  function unario() {
    if (consumir('-')) return -unario();
    if (consumir('+')) return unario();
    return potencia();
  }

  // potencia := primario ('^' unario)?
  function potencia() {
    const base = primario();
    if (consumir('^')) return Math.pow(base, unario());
    return base;
  }

  // primario := num | raiz primario | '(' expressao ')'
  function primario() {
    const t = atual();
    if (!t) throw new Error('fim inesperado');
    if (t.tipo === 'num') {
      pos++;
      return t.valor;
    }
    if (t.tipo === 'raiz') {
      pos++;
      return Math.sqrt(primario());
    }
    if (consumir('(')) {
      const v = expressao();
      if (!consumir(')')) throw new Error('parêntese não fechado');
      return v;
    }
    throw new Error('token inesperado');
  }

  try {
    const valor = expressao();
    if (pos !== tokens.length) return null;
    return Number.isFinite(valor) ? valor : null;
  } catch {
    return null;
  }
}

/**
 * Verifica se a resposta digitada corresponde a alguma das respostas aceitas.
 * Compara o texto normalizado e, quando possível, o valor numérico (com tolerância).
 * @param {string} entrada o que o grupo digitou
 * @param {string[]} aceitas lista de respostas aceitas cadastrada pelo professor
 * @returns {boolean}
 */
export function compararResposta(entrada, aceitas) {
  const digitada = normalizarResposta(entrada);
  if (!digitada || !Array.isArray(aceitas)) return false;

  const valorDigitado = avaliarExpressao(digitada);

  return aceitas.some((aceita) => {
    const esperada = normalizarResposta(aceita);
    if (!esperada) return false;
    if (digitada === esperada) return true;

    if (valorDigitado === null) return false;
    const valorEsperado = avaliarExpressao(esperada);
    return valorEsperado !== null && Math.abs(valorDigitado - valorEsperado) <= TOLERANCIA;
  });
}
