import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import RoletaPlana from './RoletaPlana.jsx';

/**
 * Roleta 3D (Three.js carregado sob demanda).
 * Props controladas: angulo, vista, destaque, demo. Eventos: aoMudarAngulo, aoInteragir.
 * Ref: { setAngulo(g), comemorar() }
 */
const Roleta3D = forwardRef(function Roleta3D(
  { angulo = 30, vista = 'hero', destaque = null, demo = false, interativa = true, aoMudarAngulo, aoInteragir, className = '', children },
  ref,
) {
  const caixa = useRef(null);
  const cena = useRef(null);
  const [estado, setEstado] = useState('carregando'); // carregando | pronto | sem-webgl
  const [anguloPlano, setAnguloPlano] = useState(angulo);
  const callbacks = useRef({ aoMudarAngulo, aoInteragir });
  callbacks.current = { aoMudarAngulo, aoInteragir };

  useEffect(() => {
    let cancelado = false;
    let instancia = null;
    import('../../tres/RoletaCena.js')
      .then(({ RoletaCena, webglDisponivel }) => {
        if (cancelado) return;
        if (!webglDisponivel()) {
          setEstado('sem-webgl');
          return;
        }
        try {
          instancia = new RoletaCena(caixa.current, {
            interativa,
            demo,
            vista,
            angulo,
            aoMudarAngulo: (g) => callbacks.current.aoMudarAngulo?.(g),
            aoInteragir: () => callbacks.current.aoInteragir?.(),
          });
          cena.current = instancia;
          if (destaque) instancia.setDestaque(destaque);
          setEstado('pronto');
        } catch (e) {
          console.warn('[Desafio 360] Sem 3D, usando a roleta 2D.', e);
          setEstado('sem-webgl');
        }
      })
      .catch(() => !cancelado && setEstado('sem-webgl'));
    return () => {
      cancelado = true;
      instancia?.dispose();
      cena.current = null;
    };
    // A cena é criada uma vez; as mudanças chegam pelos efeitos abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cena.current?.setAngulo(angulo);
    setAnguloPlano(angulo);
  }, [angulo]);
  useEffect(() => cena.current?.setVista(vista), [vista, estado]);
  useEffect(() => cena.current?.setDestaque(destaque), [destaque, estado]);
  useEffect(() => cena.current?.setDemo(demo), [demo, estado]);

  useImperativeHandle(ref, () => ({
    setAngulo: (g) => {
      cena.current?.setAngulo(g);
      setAnguloPlano(g);
    },
    comemorar: () => cena.current?.comemorar(),
  }));

  return (
    <div className={`roleta3d roleta3d--${estado} ${className}`}>
      <div ref={caixa} className="roleta3d__caixa" />
      {estado === 'carregando' && (
        <div className="roleta3d__carregando" aria-hidden="true">
          <span />
        </div>
      )}
      {estado === 'sem-webgl' && (
        <RoletaPlana
          angulo={anguloPlano}
          destaque={destaque}
          aoMudarAngulo={(g) => {
            setAnguloPlano(g);
            callbacks.current.aoMudarAngulo?.(g);
            callbacks.current.aoInteragir?.();
          }}
        />
      )}
      {children}
    </div>
  );
});

export default Roleta3D;
