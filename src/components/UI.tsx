import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";
import type { ReactNode } from "react";
export function Action({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? "secondary" : ""}`} to={to}>
      {children}
      <ArrowRight size={18} />
    </Link>
  );
}
export function DemoNotice() {
  return (
    <div className="notice">
      <Info size={17} />
      <span>
        <strong>DEMONSTRAÇÃO</strong> · Explore com dados fictícios. Sem
        cadastro, cobrança ou envio de documentos.
      </span>
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
