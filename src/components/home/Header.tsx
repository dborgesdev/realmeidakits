import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CalendarDays, House, List, Menu, UserRound, X } from "lucide-react";
import { useAccount } from "../../state/AccountContext";

export default function Header({
  publicPage = false,
}: {
  publicPage?: boolean;
}) {
  const { profile } = useAccount();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const requesting =
    pathname.startsWith("/corridas") || pathname.startsWith("/solicitacao");
  const accountPath =
    publicPage && !profile
      ? "/conta?continuar=" + encodeURIComponent(pathname)
      : "/conta";

  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="header rak-chrome rak-site-header">
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
              alt=""
            />
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav
            id="main-navigation"
            className={open ? "nav open" : "nav"}
            aria-label="Navegação principal"
            onKeyDown={(event) => {
              if (event.key === "Escape" && open) {
                setOpen(false);
                event.currentTarget.parentElement
                  ?.querySelector("button")
                  ?.focus();
              }
            }}
          >
            <NavLink
              end
              reloadDocument={publicPage}
              to="/"
              onClick={() => setOpen(false)}
            >
              <House aria-hidden="true" size={21} /> Início
            </NavLink>
            <Link
              reloadDocument
              to="/corridas"
              className={requesting ? "active" : undefined}
              aria-current={requesting ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              <CalendarDays aria-hidden="true" size={21} /> Solicitar kit
            </Link>
            <NavLink
              reloadDocument={publicPage}
              to="/acompanhamento"
              onClick={() => setOpen(false)}
            >
              <List aria-hidden="true" size={21} /> Meus pedidos
            </NavLink>
            <NavLink
              reloadDocument={publicPage}
              to={accountPath}
              onClick={() => setOpen(false)}
            >
              <UserRound aria-hidden="true" size={21} /> Minha conta
            </NavLink>
          </nav>
        </div>
      </header>
    </>
  );
}
