import { useEffect } from "react";
import { createPortal } from "react-dom";
import Header from "./components/home/Header";
import Footer from "./components/home/Footer";
import RaceSelectionButton from "./components/RaceSelectionButton";
import SelectionSummary from "./components/selection/SelectionSummary";
import CatalogStatus from "./components/CatalogStatus";
import { useCatalog } from "./state/CatalogContext";
import { useRequest } from "./state/RequestContext";

const targets = Array.from(
  document.querySelectorAll<HTMLElement>("[data-race-selection]"),
);
const header = document.getElementById("public-header");
const footer = document.getElementById("public-footer");
const summary = document.getElementById("public-selection");
const preference = document.getElementById("public-preference");
if (document.getElementById("public-races")) {
  header?.replaceChildren();
  footer?.replaceChildren();
}

export default function PublicRaceControls() {
  const { status, findRace } = useCatalog();
  const { draft, prefer } = useRequest();
  useEffect(() => {
    const url = new URL(location.href);
    const modality = url.searchParams.get("modalidade");
    if (modality !== "appai" && modality !== "oficial") return;
    prefer(modality);
    url.searchParams.delete("modalidade");
    history.replaceState(history.state, "", url);
  }, [prefer]);
  return (
    <>
      {header && createPortal(<Header publicPage />, header)}
      {footer && createPortal(<Footer publicPage />, footer)}
      {preference &&
        draft.preferredModality &&
        createPortal(
          <p className="notice">
            Preferência inicial{" "}
            {draft.preferredModality === "appai"
              ? "Associado à APPAI"
              : "Kit Oficial"}
            . Você pode alterar a modalidade de cada participante e corrida.
          </p>,
          preference,
        )}
      {summary &&
        createPortal(
          status === "ready" ? (
            <SelectionSummary publicPage />
          ) : (
            <CatalogStatus />
          ),
          summary,
        )}
      {targets.map((target) => {
        const race = findRace(target.dataset.raceSelection || "");
        return (
          race &&
          createPortal(<RaceSelectionButton event={race} />, target, race.id)
        );
      })}
    </>
  );
}
