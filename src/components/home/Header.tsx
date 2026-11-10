import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAccount } from "../../state/AccountContext";
import { Menu, X } from "lucide-react";
export default function Header({
  publicPage = false,
}: {
  publicPage?: boolean;
}) {
  const { profile } = useAccount();
  const accountPath =
    publicPage && !profile
      ? "/conta?continuar=" + encodeURIComponent(location.pathname)
      : "/conta";
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="header">
        <div className="container header-inner">
          <Link
            reloadDocument={publicPage}
            to="/"
            aria-label="Re Almeida Kits, início"
          >
            <img
              className="brand"
              src="/brand/logo-corredor-original.jpg"
              width="180"
              height="65"
              alt="Re Almeida — marca original com corredor"
            />
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={open ? "nav open" : "nav"}
            aria-label="Navegação principal"
            onClick={() => setOpen(false)}
          >
            <NavLink reloadDocument={publicPage} to="/">
              Início
            </NavLink>
            <NavLink reloadDocument to="/corridas">
              Corridas
            </NavLink>
            <a href="/#como-funciona">Como funciona</a>
            <a href="/#modalidades">Modalidades</a>
            <NavLink reloadDocument={publicPage} to={accountPath}>
              {profile ? "Minha conta" : "Entrar"}
            </NavLink>
            <Link reloadDocument={publicPage} to="/orientacoes">
              Orientações
            </Link>
            <Link className="button small" reloadDocument to="/corridas">
              Ver corridas <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
