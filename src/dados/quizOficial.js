/**
 * Quiz oficial do Desafio 360 — 30 perguntas sobre o círculo trigonométrico.
 *
 * Cobre os 16 ângulos notáveis (0°, 30°, 45°, 60°, 90°, 120°, 135°, 150°,
 * 180°, 210°, 225°, 240°, 270°, 300°, 315°, 330°) com:
 *  - valores de seno, cosseno e tangente;
 *  - conversão entre graus e radianos;
 *  - sinal das funções por quadrante;
 *  - casos em que a tangente não existe (90° e 270°).
 *
 * Tipos: "multipla" (4 alternativas, `correta` = índice), "vf" (`correta` =
 * true/false) e "valor" (`respostasAceitas` = lista comparada com
 * normalizarResposta()).
 *
 * Somente leitura no painel: o professor pode duplicá-lo para editar.
 */

export const ID_QUIZ_OFICIAL = 'oficial';

export const quizOficial = {
  id: ID_QUIZ_OFICIAL,
  titulo: 'Círculo Trigonométrico — Oficial',
  descricao: '30 perguntas sobre os 16 ângulos notáveis. Use a roleta para descobrir as respostas!',
  oficial: true,
  perguntas: [
    {
      id: 'of01',
      tipo: 'multipla',
      enunciado: 'Qual é o valor de sen 30°?',
      alternativas: ['1/2', '√3/2', '√2/2', '1'],
      correta: 0,
      explicacao: '30° fica no 1º quadrante. O seno é a coordenada y do ponto no círculo unitário: sen 30° = 1/2.',
    },
    {
      id: 'of02',
      tipo: 'valor',
      enunciado: 'Qual é o valor de cos 0°?',
      respostasAceitas: ['1'],
      explicacao: 'Em 0° o ponto do círculo unitário é (1, 0). O cosseno é a coordenada x, então cos 0° = 1.',
    },
    {
      id: 'of03',
      tipo: 'multipla',
      enunciado: 'Qual é o valor de tg 45°?',
      alternativas: ['0', '1', '√3', '√2/2'],
      correta: 1,
      explicacao: 'Em 45° seno e cosseno são iguais (√2/2). Como tg = sen ÷ cos, tg 45° = 1.',
    },
    {
      id: 'of04',
      tipo: 'valor',
      enunciado: 'Qual é o valor de sen 60°? (pode escrever √3/2, raiz(3)/2 ou 0,866)',
      respostasAceitas: ['√3/2', '0.866'],
      explicacao: 'sen 60° = √3/2 ≈ 0,866. É o mesmo valor do cos 30°, porque 60° e 30° são complementares.',
    },
    {
      id: 'of05',
      tipo: 'vf',
      enunciado: 'A tangente de 90° não existe.',
      correta: true,
      explicacao: 'Verdadeiro. Em 90°, cos 90° = 0. Como tg = sen ÷ cos, teríamos uma divisão por zero.',
    },
    {
      id: 'of06',
      tipo: 'multipla',
      enunciado: 'Quanto vale 120° em radianos?',
      alternativas: ['π/3', '2π/3', '3π/4', '5π/6'],
      correta: 1,
      explicacao: 'Multiplique por π/180: 120 × π/180 = 2π/3.',
    },
    {
      id: 'of07',
      tipo: 'valor',
      enunciado: 'Qual é o valor de cos 135°?',
      respostasAceitas: ['-√2/2', '-0.707'],
      explicacao: '135° está no 2º quadrante, onde o cosseno é negativo. Ângulo de referência 45°: cos 135° = −√2/2.',
    },
    {
      id: 'of08',
      tipo: 'multipla',
      enunciado: 'Qual é o valor de sen 150°?',
      alternativas: ['−1/2', '1/2', '√3/2', '−√3/2'],
      correta: 1,
      explicacao: '150° está no 2º quadrante, onde o seno é positivo. Referência 30°: sen 150° = 1/2.',
    },
    {
      id: 'of09',
      tipo: 'vf',
      enunciado: 'cos 180° = −1.',
      correta: true,
      explicacao: 'Verdadeiro. Em 180° o ponto do círculo é (−1, 0), então cos 180° = −1 e sen 180° = 0.',
    },
    {
      id: 'of10',
      tipo: 'valor',
      enunciado: 'Qual é o valor de sen 210°?',
      respostasAceitas: ['-1/2'],
      explicacao: '210° está no 3º quadrante, onde o seno é negativo. Referência 30°: sen 210° = −1/2.',
    },
    {
      id: 'of11',
      tipo: 'multipla',
      enunciado: 'Qual é o valor de tg 225°?',
      alternativas: ['−1', '1', '0', '√2/2'],
      correta: 1,
      explicacao: 'No 3º quadrante seno e cosseno são negativos, então a tangente é positiva. Referência 45°: tg 225° = 1.',
    },
    {
      id: 'of12',
      tipo: 'vf',
      enunciado: 'O seno de 240° é positivo.',
      correta: false,
      explicacao: 'Falso. 240° está no 3º quadrante, onde o seno é negativo: sen 240° = −√3/2.',
    },
    {
      id: 'of13',
      tipo: 'valor',
      enunciado: 'Qual é o valor de tg 270°? (se não existir, escreva "não existe")',
      respostasAceitas: ['não existe'],
      explicacao: 'Em 270° o ponto é (0, −1): cos 270° = 0. A tangente seria −1 ÷ 0, que não existe.',
    },
    {
      id: 'of14',
      tipo: 'multipla',
      enunciado: 'Qual é o valor de cos 300°?',
      alternativas: ['−1/2', '1/2', '√3/2', '−√3/2'],
      correta: 1,
      explicacao: '300° está no 4º quadrante, onde o cosseno é positivo. Referência 60°: cos 300° = 1/2.',
    },
    {
      id: 'of15',
      tipo: 'valor',
      enunciado: 'Converta 315° para radianos.',
      respostasAceitas: ['7π/4'],
      explicacao: '315 × π/180 = 7π/4. Faltam 45° (π/4) para completar a volta de 2π.',
    },
    {
      id: 'of16',
      tipo: 'vf',
      enunciado: 'sen 330° = −1/2.',
      correta: true,
      explicacao: 'Verdadeiro. 330° está no 4º quadrante (seno negativo) e tem referência 30°: sen 330° = −1/2.',
    },
    {
      id: 'of17',
      tipo: 'multipla',
      enunciado: 'Em qual quadrante o seno é positivo e o cosseno é negativo?',
      alternativas: ['1º quadrante', '2º quadrante', '3º quadrante', '4º quadrante'],
      correta: 1,
      explicacao: 'No 2º quadrante (entre 90° e 180°) os pontos têm x negativo (cosseno) e y positivo (seno).',
    },
    {
      id: 'of18',
      tipo: 'vf',
      enunciado: 'No 4º quadrante a tangente é positiva.',
      correta: false,
      explicacao: 'Falso. No 4º quadrante o seno é negativo e o cosseno positivo, então tg = sen ÷ cos é negativa.',
    },
    {
      id: 'of19',
      tipo: 'multipla',
      enunciado: 'Quanto vale 5π/6 radianos em graus?',
      alternativas: ['120°', '135°', '150°', '210°'],
      correta: 2,
      explicacao: 'Troque π por 180°: 5 × 180° ÷ 6 = 150°.',
    },
    {
      id: 'of20',
      tipo: 'valor',
      enunciado: 'Quanto vale π/4 radianos em graus?',
      respostasAceitas: ['45'],
      explicacao: 'Troque π por 180°: 180° ÷ 4 = 45°.',
    },
    {
      id: 'of21',
      tipo: 'multipla',
      enunciado: 'Para quais ângulos (entre 0° e 360°) a tangente NÃO existe?',
      alternativas: ['0° e 180°', '90° e 270°', '45° e 225°', '30° e 330°'],
      correta: 1,
      explicacao: 'A tangente não existe quando o cosseno é zero, o que acontece em 90° e 270°.',
    },
    {
      id: 'of22',
      tipo: 'vf',
      enunciado: 'cos 90° = 0.',
      correta: true,
      explicacao: 'Verdadeiro. Em 90° o ponto do círculo é (0, 1): cosseno 0 e seno 1.',
    },
    {
      id: 'of23',
      tipo: 'valor',
      enunciado: 'Qual é o valor de tg 60°?',
      respostasAceitas: ['√3', '1.732'],
      explicacao: 'tg 60° = sen 60° ÷ cos 60° = (√3/2) ÷ (1/2) = √3 ≈ 1,732.',
    },
    {
      id: 'of24',
      tipo: 'multipla',
      enunciado: 'Qual é o sinal de cos 210°?',
      alternativas: ['Positivo', 'Negativo', 'É zero', 'Não existe'],
      correta: 1,
      explicacao: '210° está no 3º quadrante, onde x é negativo. Logo, cos 210° = −√3/2 é negativo.',
    },
    {
      id: 'of25',
      tipo: 'vf',
      enunciado: 'tg 330° = √3/3.',
      correta: false,
      explicacao: 'Falso. No 4º quadrante a tangente é negativa: tg 330° = −√3/3.',
    },
    {
      id: 'of26',
      tipo: 'valor',
      enunciado: 'Qual é o valor de sen 270°?',
      respostasAceitas: ['-1'],
      explicacao: 'Em 270° o ponto do círculo é (0, −1), então sen 270° = −1. É o menor valor que o seno atinge.',
    },
    {
      id: 'of27',
      tipo: 'multipla',
      enunciado: 'Quanto vale 4π/3 radianos em graus?',
      alternativas: ['210°', '225°', '240°', '300°'],
      correta: 2,
      explicacao: 'Troque π por 180°: 4 × 180° ÷ 3 = 240°.',
    },
    {
      id: 'of28',
      tipo: 'vf',
      enunciado: 'sen 135° = cos 45°.',
      correta: true,
      explicacao: 'Verdadeiro. sen 135° = √2/2 (2º quadrante, seno positivo) e cos 45° = √2/2.',
    },
    {
      id: 'of29',
      tipo: 'valor',
      enunciado: 'Qual é o valor de cos 240°?',
      respostasAceitas: ['-1/2'],
      explicacao: '240° está no 3º quadrante, onde o cosseno é negativo. Referência 60°: cos 240° = −1/2.',
    },
    {
      id: 'of30',
      tipo: 'valor',
      enunciado: 'Converta 300° para radianos.',
      respostasAceitas: ['5π/3'],
      explicacao: '300 × π/180 = 5π/3. Faltam 60° (π/3) para completar a volta de 2π.',
    },
  ],
};

export default quizOficial;
