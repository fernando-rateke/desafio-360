import { useEffect, useState } from 'react';
import { useContagem } from '../../ganchos/useContagem.js';

const ALTURA_LINHA = 64;

function LinhaPlacar({ linha, posicao, maximo, animar }) {
  const valor = useContagem(linha.atual, { de: animar ? linha.anterior : linha.atual, duracao: 1400, atraso: 500 });
  const ganho = linha.atual - linha.anterior;
  const largura = maximo > 0 ? Math.max(4, (valor / maximo) * 100) : 4;

  return (
    <li
      className={`placar__linha ${linha.destaque ? 'placar__linha--destaque' : ''}`}
      style={{ transform: `translateY(${posicao * ALTURA_LINHA}px)` }}
    >
      <span className="placar__posicao numero">{posicao + 1}º</span>
      <div className="placar__corpo">
        <div className="placar__nome">
          <span>{linha.nome}</span>
          {animar && ganho > 0 && <span className="placar__ganho numero">+{ganho}</span>}
        </div>
        <div className="placar__barra" aria-hidden="true">
          <span style={{ width: `${largura}%` }} />
        </div>
      </div>
      <span className="placar__pontos numero">{valor}</span>
    </li>
  );
}

/**
 * Placar com a pontuação subindo e as posições se reorganizando (estilo Kahoot).
 * linhas: [{ id, nome, anterior, atual, destaque }]
 */
export default function Placar({ linhas, titulo = 'Placar', animar = true, limite }) {
  const [reordenado, setReordenado] = useState(!animar);

  useEffect(() => {
    if (!animar) return undefined;
    setReordenado(false);
    const t = setTimeout(() => setReordenado(true), 1900);
    return () => clearTimeout(t);
  }, [animar, linhas]);

  const chave = reordenado ? 'atual' : 'anterior';
  const ordem = [...linhas].sort((a, b) => b[chave] - a[chave] || a.nome.localeCompare(b.nome));
  const visiveis = limite ? ordem.slice(0, limite) : ordem;
  const posicoes = new Map(visiveis.map((l, i) => [l.id, i]));
  const maximo = Math.max(1, ...linhas.map((l) => l.atual));
  // A lista é renderizada sempre na mesma ordem (por id) para a animação de troca de posição funcionar
  const estaveis = [...linhas].filter((l) => posicoes.has(l.id)).sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return (
    <section className="placar surgir" aria-label={titulo}>
      {titulo && <h2 className="placar__titulo">{titulo}</h2>}
      <ol className="placar__lista" style={{ height: visiveis.length * ALTURA_LINHA }}>
        {estaveis.map((l) => (
          <LinhaPlacar key={l.id} linha={l} posicao={posicoes.get(l.id)} maximo={maximo} animar={animar} />
        ))}
      </ol>
    </section>
  );
}
