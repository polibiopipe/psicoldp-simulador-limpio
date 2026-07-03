import React from "react";
import { sessionStages } from "../data/sessionPrompts.js";

export function SessionSelector({ currentSession = 1, availableSessions = [1, 2], onSelect }) {
  return (
    <div className="session-selector" aria-label="Tipo de sesión simulada">
      {sessionStages.map((stage) => {
        const enabled = availableSessions.includes(stage.number);
        return (
          <button
            key={stage.number}
            type="button"
            className={currentSession === stage.number ? "selected" : ""}
            disabled={!enabled}
            onClick={() => enabled && onSelect?.(stage.number)}
            title={stage.description}
          >
            <span>{stage.label}</span>
            <strong>{stage.title}</strong>
          </button>
        );
      })}
    </div>
  );
}
