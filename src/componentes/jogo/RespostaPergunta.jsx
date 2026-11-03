import { useState } from 'react';
import AlternativasMultipla from './AlternativasMultipla.jsx';
import AlternativasVF from './AlternativasVF.jsx';
import CampoValor from './CampoValor.jsx';

/**
 * Escolhe o controle de resposta conforme o tipo da pergunta.
 * Guarda a escolha localmente para dar retorno imediato ao toque.
 */
export default function RespostaPergunta({ pergunta, aoResponder, bloqueado, valorEnviado, correta = null }) {
  const [escolhida, setEscolhida] = useState(null);
  const valor = valorEnviado ?? escolhida;

  const escolher = (v) => {
    if (bloqueado || escolhida !== null) return;
    setEscolhida(v);
    aoResponder(v);
  };

  if (pergunta.tipo === 'multipla') {
    return (
      <AlternativasMultipla
        alternativas={pergunta.alternativas}
        escolhida={valor}
        aoEscolher={escolher}
        bloqueado={bloqueado || escolhida !== null}
        correta={correta}
      />
    );
  }
  if (pergunta.tipo === 'vf') {
    return (
      <AlternativasVF escolhida={valor} aoEscolher={escolher} bloqueado={bloqueado || escolhida !== null} correta={correta} />
    );
  }
  return (
    <CampoValor
      aoEnviar={escolher}
      bloqueado={bloqueado || escolhida !== null}
      valorEnviado={valor === null ? (bloqueado ? '—' : undefined) : valor}
    />
  );
}
