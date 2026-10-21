import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/home/Header";
import Footer from "./components/home/Footer";
import Home from "./pages/Home";
import EventsPage from "./pages/EventsPage";
import RequestPage from "./pages/RequestPage";
import TrackingPage from "./pages/TrackingPage";
import LegacyRequest from "./pages/LegacyRequest";
import InfoPage from "./pages/InfoPage";
import NotFound from "./pages/NotFound";
export default function App() {
  const location = useLocation();
  useEffect(() => {
    document.title = `${location.pathname === "/" ? "Retirada de kits com praticidade" : location.pathname.startsWith("/solicitacao") ? "Solicitação demonstrativa" : location.pathname === "/acompanhamento" ? "Acompanhamento demonstrativo" : "Conheça a plataforma"} | Re Almeida Kits`;
    if (!location.hash) {
      window.scrollTo(0, 0);
      document.getElementById("conteudo")?.focus({ preventScroll: true });
    } else
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    const configured = import.meta.env.VITE_SITE_URL || window.location.origin;
    if (configured) {
      let link = document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = new URL(location.pathname, configured).href;
    }
  }, [location.pathname, location.hash]);
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/corridas" element={<EventsPage />} />
          <Route path="/corridas/:slug" element={<EventsPage />} />
          <Route
            path="/solicitacao/:stage"
            element={<RequestPage key={location.pathname} />}
          />
          <Route path="/solicitacao/:slug/:stage" element={<LegacyRequest />} />
          <Route path="/acompanhamento" element={<TrackingPage />} />
          <Route path="/orientacoes" element={<InfoPage />} />
          <Route path="/privacidade" element={<InfoPage privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
