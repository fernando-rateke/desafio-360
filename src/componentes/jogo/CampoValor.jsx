import { useRef, useState } from 'react';

/** Símbolos difíceis de digitar no celular. */
const ATALHOS = [
  { rotulo: '√', inserir: '√' },
  { rotulo: 'π', inserir: 'π' },
  { rotulo: '/', inserir: '/' },
  { rotulo: '−', inserir: '-' },
  { rotulo: '°', inserir: '°' },
  { rotulo: 'não existe', inserir: 'não existe', substituir: true },
];

/** Campo de texto livre para "Digitar o valor". */
export default function CampoValor({ aoEnviar, bloqueado, valorEnviado }) {
  const [texto, setTexto] = useState('');
  const entrada = useRef(null);

  const inserir = ({ inserir: s, substituir }) => {
    const el = entrada.current;
    if (substituir || !el) {
      setTexto(s);
    } else {
      const ini = el.selectionStart ?? texto.length;
      const fim = el.selectionEnd ?? texto.length;
      const novo = texto.slice(0, ini) + s + texto.slice(fim);
      setTexto(novo);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(ini + s.length, ini + s.length);
      });
    }
  };

  const enviar = (e) => {
    e.preventDefault();
    if (!texto.trim() || bloqueado) return;
    aoEnviar(texto.trim());
  };

  if (valorEnviado !== undefined && valorEnviado !== null) {
    return (
      <div className="campo-valor campo-valor--enviado">
        <span className="texto-suave">Sua resposta:</span>
        <strong className="campo-valor__enviado numero">{String(valorEnviado)}</strong>
      </div>
    );
  }

  return (
    <form className="campo-valor" onSubmit={enviar}>
      <label className="oculto-visualmente" htmlFor="resposta-valor">
        Sua resposta
      </label>
      <input
        id="resposta-valor"
        ref={entrada}
        className="entrada campo-valor__entrada numero"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ex.: √3/2, -1/2, 2π/3…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        disabled={bloqueado}
        autoFocus
        enterKeyHint="send"
      />
      <div className="campo-valor__atalhos" role="group" aria-label="Inserir símbolo">
        {ATALHOS.map((a) => (
          <button key={a.rotulo} type="button" className="botao botao--secundario botao--pequeno" onClick={() => inserir(a)} disabled={bloqueado}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <button type="submit" className="botao botao--primario botao--grande botao--bloco" disabled={bloqueado || !texto.trim()}>
        Enviar resposta
      </button>
    </form>
  );
}
