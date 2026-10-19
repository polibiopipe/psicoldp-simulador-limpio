import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { SeminarStandaloneApp } from "./seminar/SeminarStandaloneApp.jsx";
import "./styles.css";
import "./premium.css";
import "./visual-refresh.css";

const ThesisTomasApp = lazy(() => import("./thesis/ThesisTomasApp.jsx"));
const RootApplication = globalThis.location?.pathname?.replace(/\/$/, "") === "/tesis-tomas"
  ? ThesisTomasApp
  : globalThis.location?.pathname === "/ruta-seminario"
  ? SeminarStandaloneApp
  : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={<p role="status">Preparando el espacio…</p>}><RootApplication /></Suspense>
  </React.StrictMode>
);
