import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AccountProvider } from "./state/AccountContext";
import App from "./App";
import PublicRaceControls from "./PublicRaceControls";
import { RequestProvider } from "./state/RequestContext";
import { CatalogProvider } from "./state/CatalogContext";
import "./styles.css";
const publicRoot = document.getElementById("public-races");
ReactDOM.createRoot(publicRoot ?? document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AccountProvider>
        <CatalogProvider>
          <RequestProvider>
            {publicRoot ? <PublicRaceControls /> : <App />}
          </RequestProvider>
        </CatalogProvider>
      </AccountProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
