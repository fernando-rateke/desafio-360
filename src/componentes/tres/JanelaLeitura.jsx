import { anguloNotavelMaisProximo, diferencaAngular, NOMES_QUADRANTES } from '../../logica/angulos.js';

/**
 * Painel que reproduz a janela da roleta física: graus, radianos, sen, cos e tg.
 * `destacar` pode ser 'sen' | 'cos' | 'tg' | 'graus' | 'radianos'.
 */
export default function JanelaLeitura({ graus, destacar, compacta = false, className = '' }) {
  const proximo = anguloNotavelMaisProximo(graus);
  // Durante o giro, mostra o ângulo notável mais próximo (até 4° de distância)
  const a = Math.abs(diferencaAngular(graus, proximo.graus)) <= 4 ? proximo : null;
  const itens = a
    ? [
        ['graus', 'ângulo', `${a.graus}°`],
        ['radianos', 'radianos', a.radianos === '0' ? '0' : a.radianos],
        ['sen', 'sen', a.sen],
        ['cos', 'cos', a.cos],
        ['tg', 'tg', a.tg],
      ]
    : null;

  return (
    <div className={`janela-leitura ${compacta ? 'janela-leitura--compacta' : ''} ${className}`} aria-live="polite">
      <div className="janela-leitura__topo">
        <span className="janela-leitura__luz" aria-hidden="true" />
        <span>Janela da roleta</span>
        {a && <span className="janela-leitura__quadrante">{NOMES_QUADRANTES[a.quadrante]}</span>}
      </div>
      {itens ? (
        <dl className="janela-leitura__valores" key={a.graus}>
          {itens.map(([chave, rotulo, valor], i) => (
            <div
              key={chave}
              className={`janela-leitura__item ${destacar === chave ? 'janela-leitura__item--destaque' : ''} ${valor === '∄' ? 'janela-leitura__item--nao-existe' : ''}`}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <dt>{rotulo}</dt>
              <dd className="numero">{valor}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="janela-leitura__girando">girando…</p>
      )}
    </div>
  );
}
