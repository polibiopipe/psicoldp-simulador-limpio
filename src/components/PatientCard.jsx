import React from "react";
import { Brain, CalendarClock, FileText, MessageCircle, Signal } from "lucide-react";

export function PatientCard({
  caseItem,
  difficulty,
  sessionNumber = 1,
  totalSessions = 4,
  sessionSummary = null,
  preSessionPlan = null
}) {
  const caseImage = caseItem.image || "/avatar/placeholder.png";
  const processLabel = sessionSummary ? "Continuidad del proceso" : "Preparacion inicial";
  const proposedSessions = preSessionPlan?.proposedSessionCount || totalSessions;

  return (
    <aside className="patient-card" style={{ "--accent": caseItem.accent }}>
      <div className="patient-portrait">
        <img src={caseImage} alt={`Retrato ficticio de ${caseItem.name}`} />
      </div>
      <h2>{caseItem.name}</h2>
      <p>{caseItem.age}</p>
      <div className="patient-stat">
        <Signal aria-hidden="true" />
        <span>Dificultad seleccionada: {difficulty}</span>
      </div>
      <div className="patient-stat">
        <CalendarClock aria-hidden="true" />
        <span>Sesion {sessionNumber} de {proposedSessions} - {processLabel}</span>
      </div>
      <div className="patient-stat">
        <MessageCircle aria-hidden="true" />
        <span>{caseItem.communicationStyle}</span>
      </div>
      <div className="patient-stat">
        <Brain aria-hidden="true" />
        <span>{caseItem.expectedResponses}</span>
      </div>
      <div className="patient-clinical-note">
        <FileText aria-hidden="true" />
        <div>
          <strong>Motivo breve</strong>
          <span>{caseItem.shortTitle}</span>
        </div>
      </div>
    </aside>
  );
}
