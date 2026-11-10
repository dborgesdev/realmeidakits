import { useEffect } from "react";
export default function ConclusionPage() {
  useEffect(() => {
    location.replace("/corridas");
  }, []);
  return <a href="/corridas">Voltar às corridas</a>;
}
