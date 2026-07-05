import React from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  PlayCircle
} from "lucide-react";

export function Home({ onStart, onViewHistory, onOpenAgenda, onOpenTrust }) {
  return (
    <section className="landing-page commercial-home">
      <header className="landing-header commercial-header">
        <div className="landing-brand-lockup">
          <img
            className="brand-logo"
            src="/logo-escucha-viva-horizontal.png"
            alt="Escucha Viva"
          />
          <div>
            <strong>Escucha Viva</strong>
            <span>Plataforma formativa de simulacion clinica</span>
            <small>Una iniciativa de Nucleo Vivo.</small>
          </div>
        </div>
        <nav className="landing-nav" aria-label="Navegacion principal">
          <button type="button" onClick={onViewHistory}>Mis sesiones</button>
          <button type="button" onClick={onOpenAgenda}>Mi agenda</button>
          <button type="button" onClick={onOpenTrust}>Confianza</button>
        </nav>
      </header>

      <div className="hero-section commercial-hero">
        <div className="hero-content commercial-hero-copy">
          <span className="eyebrow">Entrevista Psicologica Formativa</span>
          <h1 className="hero-title">Entrena entrevistas psicologicas con criterio clinico.</h1>
          <p className="hero-tagline">
            Practica formativa con casos ficticios y retroalimentacion pedagogica.
          </p>
          <p className="hero-institution-note">Una iniciativa de Nucleo Vivo.</p>

          <div className="hero-actions">
            <button className="primary-action landing-primary" type="button" onClick={onStart}>
              Comenzar simulacion
              <ArrowRight aria-hidden="true" />
            </button>
            <button className="secondary-action landing-secondary" type="button" onClick={onStart}>
              <PlayCircle aria-hidden="true" />
              Ver pacientes
            </button>
            <button className="secondary-action landing-secondary" type="button" onClick={onOpenAgenda}>
              <CalendarClock aria-hidden="true" />
              Mi agenda
            </button>
          </div>
        </div>

        <div className="hero-visual-stage commercial-preview-stage">
          <aside className="simulator-preview-card commercial-preview-card" aria-label="Vista previa del simulador">
            <div className="preview-topbar">
              <div>
                <span />
                <span />
                <span />
              </div>
              <strong>Sesion simulada</strong>
            </div>

            <div className="preview-patient">
              <div className="preview-avatar">
                <img src="/avatar/claudio.png" alt="Retrato ficticio de Claudio" />
              </div>
              <div>
                <strong>Claudio</strong>
                <span>40 anos - entrevista inicial</span>
              </div>
            </div>

            <div className="preview-chat">
              <div className="preview-bubble patient">
                Siento que estoy funcionando en automatico. No es una crisis, pero algo se quedo detenido.
              </div>
              <div className="preview-bubble student">
                Gracias por contarlo. Podemos ir paso a paso.
              </div>
            </div>

            <div className="preview-composer">
              <span>Escribe tu intervencion...</span>
              <ArrowRight aria-hidden="true" />
            </div>

            <div className="preview-footer">
              <BookOpenCheck aria-hidden="true" />
              <span>Practica con calma. Aprende con criterio.</span>
            </div>
          </aside>
        </div>
      </div>

      <footer className="landing-minimal-footer">Escucha Viva</footer>
    </section>
  );
}
