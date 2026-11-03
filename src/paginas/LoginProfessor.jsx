import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Campo from '../componentes/comuns/Campo.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import AvisoFirebase from '../componentes/comuns/AvisoFirebase.jsx';
import { firebaseConfigurado } from '../servicos/firebase.js';
import { entrarProfessor, mensagemErroAuth, recuperarSenha } from '../servicos/autenticacao.js';
import { useAutenticacao } from '../ganchos/useAutenticacao.jsx';

export default function LoginProfessor() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();
  const local = useLocation();
  const { usuario } = useAutenticacao();
  const destino = local.state?.voltarPara || '/professor';

  useEffect(() => {
    if (usuario && !usuario.isAnonymous) navegar(destino, { replace: true });
  }, [usuario, navegar, destino]);

  if (!firebaseConfigurado) return <AvisoFirebase />;

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setInfo('');
    setEnviando(true);
    try {
      await entrarProfessor({ email, senha });
    } catch (falha) {
      setErro(mensagemErroAuth(falha));
    } finally {
      setEnviando(false);
    }
  };

  const esqueci = async () => {
    setErro('');
    if (!email.trim()) {
      setErro('Digite seu e-mail acima para receber o link de redefinição.');
      return;
    }
    try {
      await recuperarSenha(email);
      setInfo('Enviamos um link para redefinir a senha no seu e-mail.');
    } catch (falha) {
      setErro(mensagemErroAuth(falha));
    }
  };

  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--estreita pagina--centro">
        <form className="cartao pilha surgir" onSubmit={enviar}>
          <div>
            <span className="etiqueta etiqueta--teal">Área do professor</span>
            <h1 style={{ marginTop: 12 }}>Entrar</h1>
          </div>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          {info && <Aviso tipo="sucesso">{info}</Aviso>}
          <Campo rotulo="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Campo
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <Botao type="submit" tamanho="grande" bloco disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
          <div className="linha linha--entre">
            <button type="button" className="botao botao--fantasma botao--pequeno" onClick={esqueci}>
              Esqueci a senha
            </button>
            <Link to="/professor/cadastro">Criar conta</Link>
          </div>
        </form>
      </main>
    </>
  );
}
