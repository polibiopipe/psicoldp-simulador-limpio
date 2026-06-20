import React, { useEffect, useState } from "react";
import {
  Clock3,
  LampDesk,
  Leaf,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  UserRound,
  VideoOff
} from "lucide-react";

const avatarStateLabels = {
  idle: "En espera",
  listening: "Escuchando",
  thinking: "Pensando",
  speaking: "Respondiendo",
  closed: "Sesión finalizada"
};

export function AvatarSessionView({
  avatarState = "idle",
  caseItem,
  sessionNumber = 1,
  turnCount = 0,
  onFinish
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [caseItem.id, sessionNumber]);

  return (
    <section
      className={`simulated-video-session avatar-session-view state-${avatarState}`}
      aria-label="Sesión simulada con avatar"
    >
      <div className="video-session-status">
        <span className="avatar-state-label">
          <i aria-hidden="true" />
          {avatarStateLabels[avatarState] || avatarStateLabels.idle}
        </span>
        <div>
          <span className="video-turn-count">{turnCount} {turnCount === 1 ? "turno" : "turnos"}</span>
          <time dateTime={`PT${elapsedSeconds}S`}>
            <Clock3 aria-hidden="true" />
            {formatTimer(elapsedSeconds)}
          </time>
        </div>
      </div>

      <AvatarRoomFrame caseItem={caseItem} />

      <aside className="video-student-tile" aria-label="Participante estudiante sin cámara real">
        <UserRound aria-hidden="true" />
        <div>
          <strong>Tú</strong>
          <span>Estudiante</span>
        </div>
      </aside>

      <div className="video-session-controls" aria-label="Controles de la sesión simulada">
        <button type="button" disabled title="Control visual: no activa el micrófono">
          <MicOff aria-hidden="true" />
          <span>Micrófono inactivo</span>
        </button>
        <button type="button" disabled title="Control visual: no activa la cámara">
          <VideoOff aria-hidden="true" />
          <span>Cámara inactiva</span>
        </button>
        <button
          className="video-finish-control"
          type="button"
          onClick={onFinish}
          title="Finalizar sesión simulada"
        >
          <PhoneOff aria-hidden="true" />
          <span>Finalizar sesión</span>
        </button>
        <button type="button" disabled title="Más opciones no disponibles en esta simulación">
          <MoreHorizontal aria-hidden="true" />
          <span>Más opciones</span>
        </button>
      </div>

      <p className="video-session-disclaimer">
        Escucha Viva · Entrevista psicológica formativa · Sin cámara ni video real
      </p>
    </section>
  );
}

function AvatarRoomFrame({ caseItem }) {
  const caseImage = caseItem.image || "/casos/placeholder.png";
  const stageImage = getStageImage(caseImage);

  return (
    <div className="video-patient-stage avatar-room-frame">
      <div className="avatar-room-background" aria-hidden="true">
        <span className="room-window" />
        <LampDesk className="room-lamp" />
        <Leaf className="room-plant" />
      </div>
      <img
        className="avatar-stage-portrait"
        src={stageImage}
        alt={`Retrato ficticio de ${caseItem.name}`}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = caseImage;
        }}
      />
      <div className="video-patient-caption">
        <div>
          <strong>{caseItem.name}</strong>
          <span>{caseItem.age} · Paciente ficticio</span>
        </div>
        <small>{caseItem.shortTitle}</small>
      </div>
    </div>
  );
}

function getStageImage(imagePath) {
  if (!imagePath.startsWith("/casos/") || imagePath.includes("/stage/") || imagePath.includes("placeholder")) {
    return imagePath;
  }
  return imagePath.replace("/casos/", "/casos/stage-cutout/");
}

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
