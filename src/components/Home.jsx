import React from "react";
import { ArrowRight, BookOpenCheck, FolderClock, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

export function Home({ onStart, onViewHistory }) {
  return (
    <section className="landing-page">
      <header className="landing-header">
        <img
          className="brand-logo"
          src="/vivolab-logo.png"
          alt="VivoLab, simuladores formativos"
        />
        <div className="parent-brand-lockup">
          <span>Una iniciativa de</span>
          <img src="/nucleo-vivo-logo-horizontal.png" alt="Núcleo Vivo" />
        </div>
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">Plataforma de simuladores formativos</span>
          <h1 className="hero-title">VivoLab</h1>
          <p className="hero-tagline">
            Simuladores formativos para entrenar habilidades psicológicas y humanas.
          </p>
          <div className="current-module">
            <BookOpenCheck aria-hidden="true" />
            <span>Módulo actual</span>
            <strong>Entrevista Inicial</strong>
          </div>
          <p className="hero-subtitle">
            Practica entrevistas psicológicas iniciales con pacientes virtuales ficticios,
            en un entorno seguro, ético y orientado al aprendizaje.
          </p>

          <div className="hero-actions">
            <button className="primary-action landing-primary" type="button" onClick={onStart}>
              Iniciar simulación
              <ArrowRight aria-hidden="true" />
            </button>
            <button className="secondary-action landing-secondary" type="button" onClick={onStart}>
              Ver casos disponibles
            </button>
            <button className="secondary-action landing-secondary" type="button" onClick={onViewHistory}>
              <FolderClock aria-hidden="true" />
              Mis sesiones guardadas
            </button>
          </div>

        </div>

        <aside className="simulator-preview-card" aria-label="Vista previa del simulador">
          <div className="preview-topbar">
            <div>
              <span />
              <span />
              <span />
            </div>
            <strong>VivoLab · Entrevista Inicial</strong>
          </div>

          <div className="preview-patient">
            <div className="preview-avatar" aria-hidden="true" />
            <div>
              <strong>Tomás</strong>
              <span>Paciente ficticio · sesión simulada</span>
            </div>
          </div>

          <div className="preview-chat">
            <div className="preview-bubble student">
              ¿Qué lugar tienen los videojuegos cuando te sientes más solo?
            </div>
            <div className="preview-bubble patient">
              No sé si es soledad exactamente... pero cuando juego no tengo que estar pensando si caigo bien o mal.
            </div>
          </div>

          <div className="preview-progress">
            <div>
              <span>Progreso de sesión</span>
              <strong>4 turnos</strong>
            </div>
            <div className="preview-track">
              <span />
            </div>
          </div>

          <div className="preview-footer">
            <MessageSquareText aria-hidden="true" />
            <span>Respuesta ficticia adaptada al encuadre y al tono de la pregunta.</span>
          </div>
        </aside>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <BookOpenCheck aria-hidden="true" />
          <h2>Casos ficticios</h2>
          <p>Escenarios diseñados para practicar entrevista inicial.</p>
        </article>
        <article className="feature-card">
          <Sparkles aria-hidden="true" />
          <h2>Feedback formativo</h2>
          <p>Retroalimentación educativa sobre tu desempeño.</p>
        </article>
        <article className="feature-card">
          <ShieldCheck aria-hidden="true" />
          <h2>Entorno ético</h2>
          <p>Sin diagnósticos, tratamiento ni datos reales.</p>
        </article>
      </div>

      <article className="writing-guidance-card">
        <MessageSquareText aria-hidden="true" />
        <div>
          <h2>Practica también tu forma de preguntar</h2>
          <p>
            Antes de comenzar, intenta formular tus preguntas con claridad, buena
            redacción y signos de puntuación. Una buena entrevista también se
            construye desde preguntas respetuosas, precisas y bien formuladas.
          </p>
          <span>
            Este espacio también puede ayudarte a practicar la escritura profesional
            que luego necesitarás en registros e informes psicológicos.
          </span>
        </div>
      </article>
    </section>
  );
}
