# Desafio 360

Plataforma de quiz de trigonometria em **revezamento**, inspirada no Kahoot, que acompanha a
**roleta trigonométrica em MDF**. Como só existe um produto físico, os grupos entram numa fila
e jogam **um de cada vez**, passando a roleta adiante.

- **Professor** (computador/projetor): cria quizzes, abre a sala, controla as rodadas e mostra o placar.
- **Grupos** (celular ou computador): entram com o código de 4 letras ou pelo QR Code e respondem na vez deles.
- **Modo de teste solo** (`/teste`): joga o quiz oficial sozinho, sem login e sem Firebase.

Feito com React + Vite, Firebase (Authentication, Realtime Database e Hosting) e CSS puro.

---

## Sumário

1. [Como funciona uma partida](#como-funciona-uma-partida)
2. [Rodar o modo de teste (sem Firebase)](#1-rodar-o-modo-de-teste-sem-firebase)
3. [Criar o projeto no Firebase](#2-criar-o-projeto-no-firebase)
4. [Preencher o `.env`](#3-preencher-o-env)
5. [Publicar as regras de segurança](#4-publicar-as-regras-de-segurança)
6. [Rodar localmente](#5-rodar-localmente)
7. [Deploy no Firebase Hosting](#6-deploy-no-firebase-hosting)
8. [Testes](#testes)
9. [Estrutura do projeto](#estrutura-do-projeto)
10. [Modelo de dados e segurança](#modelo-de-dados-e-segurança)
11. [Problemas comuns](#problemas-comuns)

---

## Como funciona uma partida

1. O professor faz login, escolhe um quiz e clica em **Criar sala**. Ele define as
   **perguntas por grupo** (padrão 5) e o **tempo por pergunta** (padrão 45 s).
2. O projetor mostra o **código da sala** (ex.: `TRIG`) em letras grandes e um **QR Code**.
3. Os grupos entram com o código e escolhem um nome. Eles aparecem na **fila**.
4. O professor clica em **Iniciar rodada** para o primeiro grupo da fila. Esse grupo recebe as perguntas,
   uma de cada vez, no celular, com cronômetro. Os outros grupos veem uma tela de espera.
5. A cada pergunta, no estilo Kahoot:
   - **Pergunta:** o projetor mostra o nome do grupo, o número da pergunta, o cronômetro gigante e a
     pontuação parcial. O **enunciado fica oculto** para os outros grupos não decorarem.
   - **Resultado:** quando o grupo responde (ou o tempo acaba), o projetor mostra *Acertou!* ou *Errou*.
     O botão **Revelar na tela** exibe o enunciado, a resposta correta e a explicação. O celular do
     grupo mostra o feedback com a explicação.
   - **Placar:** a pontuação **sobe animada** e as posições se reorganizam.
6. No fim da rodada aparece a pontuação do grupo e o botão **Próximo grupo**.
7. Quando todos jogaram, o **pódio** aparece no projetor e em todos os celulares.

**Pontuação:** acerto vale `500 + 500 × (tempo restante ÷ tempo total)`, arredondado.
Erro ou tempo esgotado vale 0. O cálculo usa o horário do servidor do Firebase.

**Sem repetição:** as perguntas sorteadas para um grupo nunca aparecem para os grupos seguintes.
Se o banco acabar, o professor recebe um aviso e escolhe entre jogar com as perguntas restantes ou ir
para o pódio.

**Dicas no projetor:** `Enter`, `Espaço` ou `→` acionam o botão principal (iniciar, ver placar, próxima).
No computador, os grupos podem responder com as teclas `1–4`, `V`/`F` e `Enter`.

---

## 1. Rodar o modo de teste (sem Firebase)

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço que aparecer (normalmente `http://localhost:5173`) e acesse **`/teste`**.
O modo de teste funciona mesmo sem o `.env`.

---

## 2. Criar o projeto no Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com) e clique em **Adicionar projeto**
   (ou **Criar um projeto**). Dê um nome, por exemplo `desafio-360`. O Google Analytics é opcional.
2. **Registre um app da Web:** na página inicial do projeto, clique no ícone **`</>`** (Web), dê um
   apelido (ex.: `site`) e clique em **Registrar app**. Deixe essa página aberta: ela mostra o objeto
   `firebaseConfig`, que será usado no `.env`.
3. **Ative a autenticação:** menu **Criação → Authentication → Vamos começar → Método de login**. Ative:
   - **E-mail/senha** (login dos professores);
   - **Anônimo** (os grupos recebem um id invisível, sem precisar de login. As regras de segurança
     usam esse id para que cada grupo só possa escrever a própria resposta).
4. **Crie o Realtime Database:** menu **Criação → Realtime Database → Criar banco de dados**.
   Escolha o local (ex.: `us-central1`) e comece no **modo bloqueado**. As regras do projeto serão
   publicadas no passo 4.
5. Copie a **URL do banco**, que aparece no topo da aba *Dados*
   (ex.: `https://desafio-360-default-rtdb.firebaseio.com`).

> O plano gratuito (**Spark**) é suficiente. O projeto não usa Cloud Functions: a tela do professor é
> quem sorteia, corrige e soma os pontos. Por isso ela precisa **ficar aberta** durante a partida.
> Se ela recarregar, a partida continua de onde parou, porque todo o estado fica no banco.

---

## 3. Preencher o `.env`

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencha com os valores do `firebaseConfig` (Configurações do projeto ⚙️ → Seus apps):

| Variável | Onde encontrar no `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` (ou a URL copiada no Realtime Database) |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Deixe `VITE_USAR_EMULADOR=false`. O `.env` está no `.gitignore` e **não** vai para o GitHub.

> As chaves do app da Web do Firebase não são secretas (elas vão para o navegador de qualquer
> forma). Quem protege os dados são as **regras de segurança** do passo seguinte.

---

## 4. Publicar as regras de segurança

Instale a ferramenta de linha de comando do Firebase e faça login:

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

Associe a pasta ao seu projeto (use o **ID do projeto**, que aparece nas configurações):

```bash
firebase use --add
```

Publique as regras do arquivo `database.rules.json`:

```bash
firebase deploy --only database
```

Alternativa sem linha de comando: copie o conteúdo de `database.rules.json` em
**Realtime Database → Regras** e clique em **Publicar**.

---

## 5. Rodar localmente

```bash
npm run dev
```

- Professor: `http://localhost:5173/professor/cadastro` → crie sua conta.
- Grupos no celular, **na mesma rede Wi-Fi**: use o endereço `Network` que o Vite mostra no terminal
  (ex.: `http://192.168.0.12:5173/entrar`). O QR Code da sala já usa o endereço que estiver aberto no
  navegador do professor. Por isso, abra a tela do professor pelo endereço de rede, não por `localhost`.

---

## 6. Deploy no Firebase Hosting

1. Se ainda não fez, siga o passo 4 (`firebase login` e `firebase use --add`).
2. Gere a versão de produção e publique o site e as regras:

```bash
npm run deploy
```

Esse comando roda `vite build` e depois `firebase deploy` (Hosting e regras do banco, conforme o
`firebase.json`). No final aparece o endereço do site, por exemplo `https://desafio-360.web.app`.

3. **QR Code para colar na roleta:** gere um QR Code apontando para `https://SEU-PROJETO.web.app/entrar`
   (qualquer gerador de QR Code serve), imprima e cole na base do produto. Cada sala também mostra um
   QR Code próprio no projetor, que já leva direto para a sala.

> Se for usar um domínio próprio, adicione-o em **Authentication → Configurações → Domínios autorizados**.

---

## Testes

**Lógica do jogo** (normalização de respostas, pontuação, sorteio sem repetição, validação e quiz oficial):

```bash
npm test
```

**Regras de segurança**, contra os emuladores locais do Firebase (precisa de Java instalado).
Em um terminal, suba os emuladores:

```bash
npm run emuladores
```

Em outro terminal, rode os testes das regras:

```bash
npm run testar:regras
```

O script tenta, entre outras coisas: um grupo ler o gabarito, responder pelo outro grupo, trocar a
resposta, inflar a própria pontuação ou responder fora do tempo. Tudo isso deve ser **negado**.

Para jogar o site inteiro usando os emuladores (sem projeto real), use no `.env`
`VITE_FIREBASE_PROJECT_ID=demo-desafio360`,
`VITE_FIREBASE_DATABASE_URL=https://demo-desafio360-default-rtdb.firebaseio.com`,
qualquer texto nos outros campos e `VITE_USAR_EMULADOR=true`.

---

## Estrutura do projeto

```
src/
├── paginas/          Telas (uma por rota)
│   ├── Inicio.jsx              /
│   ├── LoginProfessor.jsx      /professor/login
│   ├── CadastroProfessor.jsx   /professor/cadastro
│   ├── PainelProfessor.jsx     /professor
│   ├── EditorQuiz.jsx          /professor/quiz/novo e /professor/quiz/:id
│   ├── ControleSala.jsx        /professor/sala/:codigo  (projetor + motor da partida)
│   ├── EntrarSala.jsx          /entrar
│   ├── SalaGrupo.jsx           /sala/:codigo  (lobby, perguntas, espera, pódio)
│   └── TesteSolo.jsx           /teste
├── componentes/
│   ├── jogo/         Cronômetro (círculo unitário), alternativas, campo de valor,
│   │                 feedback, placar animado, pódio, tela de espera
│   ├── sala/         Código da sala, QR Code, fila de grupos, modal de nova sala
│   ├── editor/       Lista de perguntas e formulário da pergunta
│   ├── layout/       Fundo trigonométrico, cabeçalho, logo, rota protegida
│   └── comuns/       Botão, campo, aviso, modal, carregando
├── servicos/         Firebase: inicialização, autenticação, quizzes, salas, partida, relógio
├── logica/           Funções puras e testadas
│   ├── normalizarResposta.js   normalizarResposta(), avaliarExpressao(), compararResposta()
│   ├── pontuacao.js            calcularPontos(), calcularTempoRestante()
│   ├── sorteio.js              sortearPerguntas() sem repetição
│   ├── perguntas.js            validação, correção e versão pública (sem gabarito)
│   └── gerarCodigo.js          código de 4 letras
├── ganchos/          Hooks: autenticação, assinatura do banco, cronômetro, contagem animada
├── dados/
│   └── quizOficial.js          30 perguntas sobre os 16 ângulos notáveis
└── estilos/          CSS puro (variáveis, componentes, jogo, professor, editor, sala)
```

### Como as respostas digitadas são corrigidas

`normalizarResposta()` remove espaços e acentos, converte para minúsculas, troca vírgula por ponto,
transforma `√`/`sqrt`/`raiz de` em `raiz(...)`, `π` em `pi`, ignora `°`, `graus` e `rad`, e reconhece
"não existe", "indefinida" e `∄`. Depois, `avaliarExpressao()` calcula o valor de expressões simples
(sem `eval`), e a comparação aceita uma diferença de até 0,005. Assim, `√3/2`, `raiz(3)/2`, `raiz3/2`,
`0.866` e `0,866` são equivalentes, e `0,87` também é aceito. No editor há um campo
**Testar uma resposta** para conferir antes de salvar.

---

## Modelo de dados e segurança

```
usuarios/{uid}                      { nome, email, salas/{CODIGO} }
quizzes/{uidDoProfessor}/{quizId}   { titulo, perguntas: [...], criadoEm, atualizadoEm }
salas/{CODIGO}
  hostUid, quizTitulo, estado ("lobby" | "rodada" | "podio" | "encerrada")
  config        { perguntasPorGrupo, tempoPorPergunta }
  grupos/{uid}  { nome, entrouEm, pontuacao, acertos, jogou }
  rodada        { grupoUid, grupoNome, numero, total, fase, parcial, acertos, pontuacaoAntes }
  perguntaAtiva { id, tipo, enunciado, alternativas, tempo, inicioEm }   ← SEM gabarito
  correcao      { acertou, pontos, respostaCorreta, explicacao, ... }   ← após a resposta
  respostas/{uid}/{idPergunta}  { valor, respondidoEm }
  privado       { quiz (com gabarito), usadas, sorteadas }               ← só o professor
```

**Proteção do gabarito:** o grupo nunca lê o quiz. A tela do professor copia para `perguntaAtiva`
apenas o enunciado, o tipo, as alternativas e o tempo. As regras do banco **recusam** gravar `correta`,
`respostasAceitas` ou `explicacao` nesse nó, e só o professor e o grupo da vez conseguem lê-lo.

Resumo das regras (`database.rules.json`):

- **Quizzes:** leitura e escrita só pelo dono (contas anônimas não gravam quizzes).
- **Salas:** só professores criam salas. Só o host (`hostUid`) altera a sala, e o `hostUid` não pode
  ser trocado. A sala inteira e o nó `privado` só o host lê.
- **Grupos:** cada um cria apenas a própria entrada, com pontuação 0. Depois disso, só o host altera.
- **Respostas:** cada grupo escreve **só a própria resposta**, **uma vez**, apenas quando é a vez dele,
  apenas para a pergunta ativa e com `respondidoEm` igual ao horário do servidor (não dá para
  "adiantar o relógio").

> Limitação: as respostas do **quiz oficial** estão no código do site (`src/dados/quizOficial.js`),
> que é público. Quem inspecionar os arquivos JavaScript consegue encontrá-las. Os quizzes criados
> pelos professores ficam protegidos no banco.

---

## Problemas comuns

| Sintoma | Solução |
|---|---|
| "Firebase ainda não configurado" | Preencha o `.env` e reinicie o `npm run dev`. |
| "Esse método de login não está ativado" | Ative **E-mail/senha** e **Anônimo** em Authentication → Método de login. |
| `PERMISSION_DENIED` no console | Publique as regras (`firebase deploy --only database`). |
| O celular não abre `localhost` | Use o endereço de rede do Vite (`http://192.168.x.x:5173`), na mesma Wi-Fi. |
| Página em branco ao recarregar uma rota no Hosting | Confira o `rewrites` no `firebase.json` (já vem configurado). |
| A partida "travou" | Mantenha a tela do professor aberta. Se fechou, abra `/professor/sala/CODIGO` de novo: a partida continua de onde parou. |
