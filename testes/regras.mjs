/**
 * Teste das regras de segurança (database.rules.json) contra os emuladores.
 * Uso: npm run emuladores (em outro terminal) e depois npm run testar:regras
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, set, get, update, serverTimestamp } from 'firebase/database';

const config = {
  apiKey: 'demo-chave',
  projectId: 'demo-desafio360',
  databaseURL: 'https://demo-desafio360-default-rtdb.firebaseio.com',
  appId: '1:1:web:1',
};

let n = 0;
async function cliente(tipo) {
  const app = initializeApp(config, `cliente${n++}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const { user } =
    tipo === 'anonimo'
      ? await signInAnonymously(auth)
      : await createUserWithEmailAndPassword(auth, `p${Date.now()}${n}@teste.com`, 'segredo123');
  return { db, uid: user.uid };
}

let falhas = 0;
async function espera(descricao, deveFuncionar, acao) {
  let funcionou = true;
  try {
    await acao();
  } catch (e) {
    funcionou = false;
    if (!String(e.message).includes('ermission')) console.log('   erro inesperado:', e.message);
  }
  const ok = funcionou === deveFuncionar;
  if (!ok) falhas++;
  console.log(`${ok ? '✓' : '✗'} ${descricao} → ${funcionou ? 'permitido' : 'negado'}`);
}

const C = 'T' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 'ST';
const prof = await cliente('email');
const outroProf = await cliente('email');
const g1 = await cliente('anonimo');
const g2 = await cliente('anonimo');
const r = (cli, caminho) => ref(cli.db, caminho);

console.log(`\nSala ${C}\n`);
await espera('anônimo NÃO cria sala', false, () => set(r(g1, `salas/${C}`), { hostUid: g1.uid, estado: 'lobby' }));
await espera('professor cria sala', true, () =>
  set(r(prof, `salas/${C}`), {
    hostUid: prof.uid,
    estado: 'lobby',
    quizTitulo: 'Q',
    config: { perguntasPorGrupo: 2, tempoPorPergunta: 30 },
    privado: { quiz: { perguntas: { p1: { id: 'p1', tipo: 'vf', enunciado: 'x', correta: true } } } },
  }),
);
await espera('outro professor NÃO altera a sala', false, () => set(r(outroProf, `salas/${C}/estado`), 'podio'));
await espera('outro professor NÃO toma a sala', false, () => set(r(outroProf, `salas/${C}/hostUid`), outroProf.uid));

const grupo = (nome, extra = {}) => ({ nome, entrouEm: serverTimestamp(), pontuacao: 0, acertos: 0, jogou: false, ...extra });
await espera('grupo NÃO entra com pontuação inflada', false, () => set(r(g1, `salas/${C}/grupos/${g1.uid}`), grupo('G1', { pontuacao: 9999 })));
await espera('grupo 1 entra na fila', true, () => set(r(g1, `salas/${C}/grupos/${g1.uid}`), grupo('G1')));
await espera('grupo 2 entra na fila', true, () => set(r(g2, `salas/${C}/grupos/${g2.uid}`), grupo('G2')));
await espera('grupo NÃO muda a própria pontuação', false, () => set(r(g1, `salas/${C}/grupos/${g1.uid}/pontuacao`), 5000));
await espera('grupo NÃO apaga outro grupo', false, () => set(r(g1, `salas/${C}/grupos/${g2.uid}`), null));
await espera('grupo NÃO lê a sala inteira', false, () => get(r(g1, `salas/${C}`)));
await espera('grupo NÃO lê o gabarito (privado)', false, () => get(r(g1, `salas/${C}/privado`)));
await espera('grupo lê estado, grupos e rodada', true, async () => {
  await get(r(g1, `salas/${C}/estado`));
  await get(r(g1, `salas/${C}/grupos`));
  await get(r(g1, `salas/${C}/rodada`));
});

await espera('host NÃO publica pergunta com gabarito', false, () =>
  set(r(prof, `salas/${C}/perguntaAtiva`), { id: 'p1', tipo: 'vf', enunciado: 'x', tempo: 30, correta: true }),
);
await espera('host inicia rodada do grupo 1', true, () =>
  update(r(prof, `salas/${C}`), {
    estado: 'rodada',
    rodada: { grupoUid: g1.uid, grupoNome: 'G1', numero: 1, total: 2, fase: 'pergunta', parcial: 0 },
    perguntaAtiva: { id: 'p1', tipo: 'vf', enunciado: 'x', tempo: 30, inicioEm: serverTimestamp() },
  }),
);
await espera('grupo da vez lê a pergunta ativa', true, () => get(r(g1, `salas/${C}/perguntaAtiva`)));
await espera('outro grupo NÃO lê a pergunta ativa', false, () => get(r(g2, `salas/${C}/perguntaAtiva`)));
await espera('outro grupo NÃO lê a correção', false, () => get(r(g2, `salas/${C}/correcao`)));
await espera('outro grupo NÃO responde pelo grupo da vez', false, () =>
  set(r(g2, `salas/${C}/respostas/${g1.uid}/p1`), { valor: true, respondidoEm: serverTimestamp() }),
);
await espera('outro grupo NÃO responde fora da vez', false, () =>
  set(r(g2, `salas/${C}/respostas/${g2.uid}/p1`), { valor: true, respondidoEm: serverTimestamp() }),
);
await espera('grupo NÃO responde com horário falso', false, () =>
  set(r(g1, `salas/${C}/respostas/${g1.uid}/p1`), { valor: true, respondidoEm: 1 }),
);
await espera('grupo NÃO responde pergunta que não está ativa', false, () =>
  set(r(g1, `salas/${C}/respostas/${g1.uid}/p2`), { valor: true, respondidoEm: serverTimestamp() }),
);
await espera('grupo da vez responde', true, () =>
  set(r(g1, `salas/${C}/respostas/${g1.uid}/p1`), { valor: true, respondidoEm: serverTimestamp() }),
);
await espera('grupo NÃO troca a resposta depois de enviar', false, () =>
  set(r(g1, `salas/${C}/respostas/${g1.uid}/p1`), { valor: false, respondidoEm: serverTimestamp() }),
);
await espera('host corrige e soma pontos', true, () =>
  update(r(prof, `salas/${C}`), {
    'rodada/fase': 'resultado',
    [`grupos/${g1.uid}/pontuacao`]: 900,
    correcao: { idPergunta: 'p1', acertou: true, pontos: 900 },
  }),
);
await espera('grupo NÃO responde depois do fim da pergunta', false, () =>
  set(r(g1, `salas/${C}/respostas/${g1.uid}/p9`), { valor: true, respondidoEm: serverTimestamp() }),
);
await espera('outro professor NÃO lê quizzes alheios', false, () => get(r(outroProf, `quizzes/${prof.uid}`)));
await espera('professor grava o próprio quiz', true, () => set(r(prof, `quizzes/${prof.uid}/q1`), { titulo: 'Meu quiz' }));
await espera('anônimo NÃO grava quiz', false, () => set(r(g1, `quizzes/${g1.uid}/q1`), { titulo: 'x' }));

console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTodas as regras se comportaram como esperado.');
process.exit(falhas ? 1 : 0);
