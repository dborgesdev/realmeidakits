import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
    <Link
      className={`button ${secondary ? "secondary" : ""}`}
      reloadDocument={/^\/corridas(?:[/?]|$)/.test(to)}
      to={to}
    >
      {children}
      <ArrowRight size={18} />
    </Link>
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
