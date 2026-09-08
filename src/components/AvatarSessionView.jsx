import React from "react";

const stateLabels = {
  idle: "Puedes continuar",
  listening: "Preparando tu intervención",
  thinking: "Preparando respuesta",
  closed: "Sesión finalizada"
};

export function AvatarSessionView({ avatarState = "idle", caseItem, sessionNumber = 1, totalSessions = 4 }) {
  return (
    <section className="simulated-video-session avatar-session-view portrait-session" aria-label="Retrato del paciente ficticio">
      <div className="video-session-status">
        <span className="avatar-state-label">{stateLabels[avatarState] || stateLabels.idle}</span>
        <span className="video-turn-count">Sesión {sessionNumber} de {totalSessions}</span>
      </div>
      <div className={`video-patient-stage patient-video-frame patient-video-${caseItem.id}`}>
        <img className="avatar-stage-portrait" src={caseItem.image || "/avatar/placeholder.png"} alt={`Retrato ficticio de ${caseItem.name}`} loading="lazy" />
        <div className="video-patient-caption">
          <div><strong>{caseItem.name}</strong><span>{caseItem.age} · Paciente ficticio</span></div>
          <small>{caseItem.shortTitle}</small>
        </div>
      </div>
      <p className="video-session-disclaimer">Escucha Viva · Entrevista por texto</p>
    </section>
  );
}
