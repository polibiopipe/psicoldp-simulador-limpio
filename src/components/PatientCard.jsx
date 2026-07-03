import React from "react";
import { Brain, MessageCircle, Signal } from "lucide-react";

export function PatientCard({ caseItem, difficulty }) {
  const caseImage = caseItem.image || "/avatar/placeholder.png";

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
        <MessageCircle aria-hidden="true" />
        <span>{caseItem.communicationStyle}</span>
      </div>
      <div className="patient-stat">
        <Brain aria-hidden="true" />
        <span>{caseItem.expectedResponses}</span>
      </div>
    </aside>
  );
}
