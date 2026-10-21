import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <img
            className="brand"
            src="/brand/logo-corredor-original.jpg"
            width="190"
            height="69"
            alt="Re Almeida, marca original"
            loading="lazy"
          />
          <p>Você corre. A gente facilita.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/corridas">Corridas</Link>
          <a href="/#como-funciona">Como funciona</a>
          <a href="/#modalidades">Modalidades</a>
        </div>
        <div>
          <h3>Informações</h3>
          <Link to="/orientacoes">Documentos e retirada</Link>
          <Link to="/privacidade">Privacidade da prévia</Link>
          <a href="https://realmeidakits.com.br/">Site principal ↗</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>Re Almeida Kits · Prévia V2</span>
        <span>DEMONSTRAÇÃO · Sem operações reais</span>
        <a
          className="developer-credit"
          href="https://smartlocal.com.br"
          target="_blank"
          rel="noopener noreferrer"
        >
          Desenvolvido por Douglas Borges - Smart Local
        </a>
      </div>
    </footer>
  );
}
