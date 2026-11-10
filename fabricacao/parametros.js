/**
 * PARÂMETROS DA ROLETA FÍSICA (em milímetros).
 * Mude aqui e rode `npm run fabricacao` para gerar tudo de novo.
 */
export const PARAMETROS = {
  /** Espessura da chapa de MDF. Meça a sua chapa com paquímetro (costuma variar de 2,7 a 3,2 mm). */
  espessura: 3,

  /** Lado da base e da moldura (quadradas). */
  lado: 240,
  raioCanto: 10,

  /** Disco giratório. */
  raioDisco: 104,
  /** Folga entre o disco e o furo da moldura (de cada lado). Aumente se o disco travar. */
  folgaDisco: 0.6,
  /** Ranhuras de pegada na borda do disco. */
  ranhuras: 72,
  raioRanhura: 1.2,

  /** Eixo central (fica colado na base; o disco gira em volta). */
  raioEixo: 10,
  /** Folga do furo central do disco em volta do eixo. */
  folgaEixo: 0.4,

  /** Máscara fixa com a janela. */
  raioMascara: 82,
  janela: { r0: 42, r1: 80, meiaAltura: 5.6, raioCanto: 1.5 },
  lingueta: { meiaLargura: 8, alcance: 116 }, // presa na moldura, do lado de 180°
  ponteiro: { meiaBase: 3, ponta: 85.5 },

  /** Recortes para o dedo na moldura (ângulos em graus). */
  recortesDedo: [45, 225],
  raioRecorteDedo: 9,

  /** QR Code gravado na máscara. */
  urlQr: 'https://desafio-360-five.vercel.app/entrar',
  tamanhoQr: 30,

  /** Mesa da cortadora a laser (para montar as chapas). 600×400 é comum em escolas e makerspaces. */
  mesa: { largura: 600, altura: 400, margem: 5, espaco: 6 },
};
