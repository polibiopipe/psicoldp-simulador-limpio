import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./premium.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={<div className="screen" role="status">Cargando Escucha Viva…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);
