import React from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  ExternalLink,
  Headphones,
  HeartHandshake,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserCheck
} from "lucide-react";

const heroBenefits = [
  "Pacientes simulados realistas",
  "Feedback formativo",
  "Aprendizaje seguro y progresivo"
];

const steps = [
  {
    icon: UserCheck,
    title: "Elige un caso",
    text: "Selecciona un paciente ficticio y un nivel de practica."
  },
  {
    icon: MessageSquareText,
    title: "Conversa y explora",
    text: "Practica encuadre, preguntas, escucha y seguimiento."
  },
  {
    icon: Sparkles,
    title: "Recibe retroalimentacion",
    text: "Revisa fortalezas, oportunidades y proximos pasos."
  }
];

export function Home({ onStart, onViewHistory, onOpenAgenda, onOpenTrust }) {
  return (
    <section className="landing-page commercial-home">
      <header className="landing-header commercial-header">
        <a
          className="institutional-logo-link"
          href="https://nucleovivo.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar el sitio oficial de Nucleo Vivo"
        >
          <img
            className="brand-logo"
            src="/logo-escucha-viva-horizontal.png"
            alt="Escucha Viva, simuladores formativos"
          />
        </a>
        <nav className="landing-nav" aria-label="Navegacion principal">
          <button type="button" onClick={onViewHistory}>Mis sesiones</button>
          <button type="button" onClick={onOpenAgenda}>Mi agenda</button>
          <button type="button" onClick={onOpenTrust}>Confianza</button>
          <a
            href="https://nucleovivo.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nucleo Vivo
          </a>
        </nav>
      </header>

      <div className="hero-section commercial-hero">
        <div className="hero-content commercial-hero-copy">
          <span className="eyebrow">Escucha Viva - Simuladores formativos</span>
          <h1 className="hero-title">Simulacion clinica asistida por IA</h1>
          <p className="hero-tagline">
            Entrena entrevistas psicologicas con pacientes simulados en un entorno
            seguro, etico y formativo.
          </p>

          <div className="hero-benefits" aria-label="Beneficios principales">
            {heroBenefits.map((benefit) => (
              <span key={benefit}>
                <ShieldCheck aria-hidden="true" />
                {benefit}
              </span>
            ))}
          </div>

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

          <div className="hero-patient-stack commercial-patient-stack" aria-label="Ejemplos de pacientes ficticios">
            <article>
              <img src="/avatar/camila.png" alt="Retrato ficticio de Camila" />
              <div><strong>Camila</strong><span>Limites y sobrecarga</span></div>
            </article>
            <article>
              <img src="/avatar/marcos.png" alt="Retrato ficticio de Marcos" />
              <div><strong>Marcos</strong><span>Estres laboral</span></div>
            </article>
            <article>
              <img src="/avatar/sofia.png" alt="Retrato ficticio de Sofia" />
              <div><strong>Sofia</strong><span>Ansiedad y vinculos</span></div>
            </article>
          </div>

          <div className="hero-trust-badge commercial-trust-badge">
            <HeartHandshake aria-hidden="true" />
            <div><strong>Curiosidad segura.</strong><span>Entrenamiento realista.</span></div>
          </div>
        </div>
      </div>

      <section className="how-it-works" aria-labelledby="how-it-works-title">
        <div className="section-kicker">
          <span className="eyebrow">Como funciona</span>
          <h2 id="how-it-works-title">Tres pasos para practicar mejor.</h2>
        </div>
        <div className="how-it-works-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <Icon aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <article className="trust-center-card commercial-trust-card">
        <div>
          <ShieldCheck aria-hidden="true" />
          <span className="eyebrow">Centro de confianza</span>
          <h2>Privacidad, seguridad y uso responsable.</h2>
          <p>Marco etico y de cumplimiento, sin cargar la experiencia principal.</p>
        </div>
        <button className="secondary-action" type="button" onClick={onOpenTrust}>
          Ver detalles
          <ArrowRight aria-hidden="true" />
        </button>
      </article>

      <details className="podcast-section podcast-compact">
        <summary>
          <span><Headphones aria-hidden="true" /> Podcast Nucleo Vivo</span>
          <strong>Bienestar, cultura y desarrollo humano</strong>
        </summary>
        <div className="podcast-compact-body">
          <a
            className="secondary-action podcast-action"
            href="https://open.spotify.com/show/033sQIGbzXamAjYqMuTAyU"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Spotify
            <ExternalLink aria-hidden="true" />
          </a>
          <iframe
            className="spotify-embed"
            src="https://open.spotify.com/embed/show/033sQIGbzXamAjYqMuTAyU?utm_source=generator"
            width="100%"
            height="232"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Podcast Nucleo Vivo en Spotify"
          />
        </div>
      </details>
    </section>
  );
}
