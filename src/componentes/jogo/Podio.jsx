import { useContagem } from '../../ganchos/useContagem.js';

const MEDALHAS = ['🥇', '🥈', '🥉'];

function Degrau({ grupo, lugar, atraso }) {
  const pontos = useContagem(grupo?.pontuacao || 0, { duracao: 1600, atraso });
  if (!grupo) return <div className={`podio__degrau podio__degrau--${lugar} podio__degrau--vazio`} />;
  return (
    <div className={`podio__degrau podio__degrau--${lugar}`} style={{ animationDelay: `${atraso}ms` }}>
      <span className="podio__medalha" aria-hidden="true">
        {MEDALHAS[lugar - 1]}
      </span>
      <strong className="podio__nome">{grupo.nome}</strong>
      <span className="podio__pontos numero">{pontos} pts</span>
      <div className="podio__bloco">
        <span className="numero">{lugar}º</span>
      </div>
    </div>
  );
}

/**
 * Pódio final: 3 primeiros em destaque + lista completa.
 * ranking: [{ id, nome, pontuacao, acertos? }] já ordenado
 */
export default function Podio({ ranking, destaqueId }) {
  const [primeiro, segundo, terceiro] = ranking;
  return (
    <section className="podio" aria-label="Pódio">
      <h1 className="podio__titulo">Pódio</h1>
      <div className="podio__palco">
        <Degrau grupo={segundo} lugar={2} atraso={600} />
        <Degrau grupo={primeiro} lugar={1} atraso={1200} />
        <Degrau grupo={terceiro} lugar={3} atraso={0} />
      </div>

      {ranking.length > 0 && (
        <ol className="podio__lista">
          {ranking.map((g, i) => (
            <li key={g.id} className={g.id === destaqueId ? 'podio__item--destaque' : ''}>
              <span className="numero">{i + 1}º</span>
              <span className="podio__lista-nome">{g.nome}</span>
              {g.acertos !== undefined && <span className="texto-fraco">{g.acertos} {g.acertos === 1 ? 'acerto' : 'acertos'}</span>}
              <strong className="numero">{g.pontuacao}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
