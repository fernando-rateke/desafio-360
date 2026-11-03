import Cabecalho from '../layout/Cabecalho.jsx';
import Aviso from './Aviso.jsx';
import Botao from './Botao.jsx';

/** Mostrado quando o .env ainda não foi preenchido. */
export default function AvisoFirebase() {
  return (
    <>
      <Cabecalho />
      <main className="pagina pagina--estreita pagina--centro">
        <div className="pilha">
          <Aviso tipo="alerta" titulo="Firebase ainda não configurado">
            <p>
              Preencha o arquivo <code>.env</code> com as chaves do seu projeto Firebase (veja o{' '}
              <code>README.md</code>) e reinicie o servidor.
            </p>
            <p>Enquanto isso, você pode jogar o quiz oficial no modo de teste.</p>
          </Aviso>
          <Botao para="/teste" tamanho="grande" bloco>
            Abrir modo de teste
          </Botao>
          <Botao para="/" variante="fantasma" bloco>
            Voltar ao início
          </Botao>
        </div>
      </main>
    </>
  );
}
