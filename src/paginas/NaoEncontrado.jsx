import Cabecalho from '../componentes/layout/Cabecalho.jsx';
import Botao from '../componentes/comuns/Botao.jsx';

export default function NaoEncontrado() {
  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--estreita pagina--centro texto-centro">
        <p className="numero" style={{ fontSize: '4rem', margin: 0, color: 'var(--ambar)' }}>
          tg 90°
        </p>
        <h1>Esta página não existe</h1>
        <p className="texto-suave">Assim como a tangente de 90°.</p>
        <Botao para="/" tamanho="grande">
          Voltar ao início
        </Botao>
      </main>
    </>
  );
}
