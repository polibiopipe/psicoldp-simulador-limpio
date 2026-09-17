import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { SeminarStandaloneApp } from "./seminar/SeminarStandaloneApp.jsx";
import "./styles.css";
import "./premium.css";
import "./visual-refresh.css";

const RootApplication = globalThis.location?.pathname === "/ruta-seminario"
  ? SeminarStandaloneApp
  : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApplication />
  </React.StrictMode>
);
