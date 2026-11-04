import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Campo from '../componentes/comuns/Campo.jsx';
import Botao from '../componentes/comuns/Botao.jsx';
import Aviso from '../componentes/comuns/Aviso.jsx';
import AvisoFirebase from '../componentes/comuns/AvisoFirebase.jsx';
import { firebasePronto as firebaseConfigurado } from '../servicos/firebase.js';
import { cadastrarProfessor, mensagemErroAuth } from '../servicos/autenticacao.js';
import { useAutenticacao } from '../ganchos/useAutenticacao.jsx';

export default function CadastroProfessor() {
  const [dados, setDados] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();
  const { usuario } = useAutenticacao();

  useEffect(() => {
    if (usuario && !usuario.isAnonymous && !enviando) navegar('/professor', { replace: true });
  }, [usuario, navegar, enviando]);

  if (!firebaseConfigurado) return <AvisoFirebase />;

  const mudar = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    if (dados.nome.trim().length < 2) return setErro('Digite seu nome.');
    if (dados.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (dados.senha !== dados.confirmar) return setErro('As senhas não conferem.');
    setEnviando(true);
    try {
      await cadastrarProfessor(dados);
      navegar('/professor', { replace: true });
    } catch (falha) {
      setErro(mensagemErroAuth(falha));
      setEnviando(false);
    }
  };

  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--estreita pagina--centro">
        <form className="cartao pilha surgir" onSubmit={enviar}>
          <div>
            <span className="etiqueta etiqueta--teal">Área do professor</span>
            <h1 style={{ marginTop: 12 }}>Criar conta</h1>
          </div>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Campo rotulo="Nome" autoComplete="name" value={dados.nome} onChange={mudar('nome')} required />
          <Campo rotulo="E-mail" type="email" autoComplete="email" value={dados.email} onChange={mudar('email')} required />
          <Campo
            rotulo="Senha"
            type="password"
            autoComplete="new-password"
            dica="Mínimo de 6 caracteres."
            value={dados.senha}
            onChange={mudar('senha')}
            required
          />
          <Campo rotulo="Confirmar senha" type="password" autoComplete="new-password" value={dados.confirmar} onChange={mudar('confirmar')} required />
          <Botao type="submit" tamanho="grande" bloco disabled={enviando}>
            {enviando ? 'Criando conta…' : 'Criar conta'}
          </Botao>
          <p className="texto-centro texto-suave" style={{ margin: 0 }}>
            Já tem conta? <Link to="/professor/login">Entrar</Link>
          </p>
        </form>
      </main>
    </>
  );
}
