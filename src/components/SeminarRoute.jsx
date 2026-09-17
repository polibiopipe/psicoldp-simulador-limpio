import React from "react";
import { LockKeyhole } from "lucide-react";
import { canAccessSeminarRoute } from "../lib/seminarAccess.js";
import seminarDocument from "../seminar/rutaSeminarioDocument.js";

export function SeminarRoute({ userEmail }) {
  if (!canAccessSeminarRoute(userEmail)) {
    return (
      <section className="screen seminar-access-denied" role="alert">
        <LockKeyhole aria-hidden="true" />
        <div>
          <span className="eyebrow">Acceso restringido</span>
          <h1>Ruta de Seminario</h1>
          <p>Este espacio está habilitado únicamente para el equipo de Seminario registrado.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="seminar-route-screen" aria-label="Ruta de Seminario">
      <iframe
        className="seminar-route-frame"
        srcDoc={seminarDocument}
        title="Ruta de Seminario · PsicoLDP"
      />
    </section>
  );
}
