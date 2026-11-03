import Logo from './Logo.jsx';

export default function Cabecalho({ children, logoPara = '/' }) {
  return (
    <header className="cabecalho">
      <Logo para={logoPara} />
      {children && <div className="cabecalho__acoes">{children}</div>}
    </header>
  );
}
