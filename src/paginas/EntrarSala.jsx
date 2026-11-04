import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import AvisoFirebase from '../componentes/comuns/AvisoFirebase.jsx';
import { firebasePronto as firebaseConfigurado } from '../servicos/firebase.js';
import { garantirLoginGrupo, mensagemErroAuth } from '../servicos/autenticacao.js';
import { lerEstadoSala } from '../servicos/salas.js';
import { limparCodigo, codigoValido } from '../logica/gerarCodigo.js';

export default function EntrarSala() {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const navegar = useNavigate();

  if (!firebaseConfigurado) return <AvisoFirebase />;

  const enviar = async (e) => {
    e.preventDefault();
    if (!codigoValido(codigo)) return setErro('O código tem 4 letras.');
    setErro('');
    setVerificando(true);
    try {
      await garantirLoginGrupo();
      const estado = await lerEstadoSala(codigo);
      if (!estado || estado === 'encerrada') {
        setErro(`Não encontramos uma sala aberta com o código ${codigo}.`);
        setVerificando(false);
        return;
      }
      navegar(`/sala/${codigo}`);
    } catch (falha) {
      setErro(falha?.code?.startsWith('auth/') ? mensagemErroAuth(falha) : 'Não foi possível verificar o código. Confira a internet.');
      setVerificando(false);
    }
  };

  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--estreita pagina--centro">
        <form className="pilha surgir entrar" onSubmit={enviar}>
          <h1 className="texto-centro">Código da sala</h1>
          <p className="texto-suave texto-centro" style={{ margin: 0 }}>
            O código de 4 letras está no projetor.
          </p>
          <label className="oculto-visualmente" htmlFor="codigo">
            Código da sala
          </label>
          <input
            id="codigo"
            className="entrada entrar__codigo numero"
            value={codigo}
            onChange={(e) => {
              setCodigo(limparCodigo(e.target.value));
              setErro('');
            }}
            placeholder="TRIG"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            inputMode="text"
            maxLength={4}
            autoFocus
          />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao type="submit" tamanho="grande" bloco disabled={codigo.length !== 4 || verificando}>
            {verificando ? 'Procurando sala…' : 'Entrar'}
          </Botao>
          <p className="texto-centro texto-suave" style={{ margin: 0 }}>
            Primeira vez com a roleta? <Link to="/tutorial">Veja o tutorial de 2 minutos</Link>
          </p>
        </form>
      </main>
    </>
  );
}
