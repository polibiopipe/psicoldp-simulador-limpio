import React from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  ExternalLink,
  FolderClock,
  Headphones,
  HeartHandshake,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
  Sprout
} from "lucide-react";

export function Home({ onStart, onViewHistory }) {
  return (
    <section className="landing-page">
      <header className="landing-header">
        <a
          className="institutional-logo-link"
          href="https://nucleovivo.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar el sitio oficial de Núcleo Vivo"
        >
          <img
            className="brand-logo"
            src="/escucha-viva-logo.png"
            alt="Escucha Viva, simuladores formativos"
          />
        </a>
        <a
          className="parent-brand-lockup"
          href="https://nucleovivo.net/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar el sitio oficial de Núcleo Vivo"
        >
          <span>Una iniciativa de</span>
          <img src="/nucleo-vivo-logo-horizontal.png" alt="Núcleo Vivo" />
        </a>
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">Simuladores formativos</span>
          <h1 className="hero-title">Escucha Viva</h1>
          <p className="hero-tagline">
            Entrena habilidades de entrevista psicológica en un entorno formativo,
            ético y humano.
          </p>
          <div className="current-module">
            <BookOpenCheck aria-hidden="true" />
            <span>Módulo actual</span>
            <strong>Entrevista Psicológica Formativa</strong>
          </div>
          <p className="hero-subtitle">
            Practica entrevistas psicológicas iniciales con pacientes virtuales ficticios,
            en un entorno seguro, ético y orientado al aprendizaje.
          </p>

          <div className="hero-value-list" aria-label="Valores de la experiencia formativa">
            <span><ShieldCheck aria-hidden="true" /> Práctica segura</span>
            <span><Sprout aria-hidden="true" /> Entrena tu escucha</span>
            <span><HeartHandshake aria-hidden="true" /> Formación humana</span>
            <span><Compass aria-hidden="true" /> Aprende con criterio</span>
          </div>

          <div className="hero-actions">
            <button className="primary-action landing-primary" type="button" onClick={onStart}>
              Comenzar simulación
              <ArrowRight aria-hidden="true" />
            </button>
            <button className="secondary-action landing-secondary" type="button" onClick={onStart}>
              <Play aria-hidden="true" />
              Ver casos disponibles
            </button>
            <button className="secondary-action landing-secondary landing-history-action" type="button" onClick={onViewHistory}>
              <FolderClock aria-hidden="true" />
              Mis sesiones guardadas
            </button>
          </div>

        </div>

        <div className="hero-visual-stage">
          <aside className="simulator-preview-card" aria-label="Vista previa del simulador">
            <div className="preview-topbar">
              <div>
                <span />
                <span />
                <span />
              </div>
              <strong>Escucha Viva · Entrevista Psicológica Formativa</strong>
            </div>

            <div className="preview-patient">
              <div className="preview-avatar">
                <img src="/avatar/tomas.png" alt="Retrato ficticio de Tomás" />
              </div>
              <div>
                <strong>Tomás</strong>
                <span>16 años · estudiante</span>
              </div>
            </div>

            <div className="preview-chat">
              <div className="preview-bubble patient">
                A veces juego porque en el computador sé qué hacer. En persona me cuesta más.
              </div>
              <div className="preview-bubble student">
                Gracias por contarlo. ¿Qué es lo que más te cuesta cuando estás con otras personas?
              </div>
            </div>

            <div className="preview-composer">
              <span>Escribe tu intervención...</span>
              <ArrowRight aria-hidden="true" />
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
              <span>Una conversación ficticia para practicar escucha, vínculo y criterio.</span>
            </div>
          </aside>

          <div className="hero-patient-stack" aria-label="Ejemplos de pacientes ficticios">
            <article>
              <img src="/avatar/camila.png" alt="Retrato ficticio de Camila" />
              <div><strong>Camila, 29</strong><span>Límites y sobrecarga</span></div>
            </article>
            <article>
              <img src="/avatar/marcos.png" alt="Retrato ficticio de Marcos" />
              <div><strong>Marcos, 38</strong><span>Estrés laboral</span></div>
            </article>
            <article>
              <img src="/avatar/elena.png" alt="Retrato ficticio de Elena" />
              <div><strong>Elena, 52</strong><span>Cambios vitales</span></div>
            </article>
          </div>

          <div className="hero-trust-badge">
            <ShieldCheck aria-hidden="true" />
            <div><strong>Práctica segura.</strong><span>Aprendizaje real.</span></div>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <BookOpenCheck aria-hidden="true" />
          <h2>Casos progresivos</h2>
          <p>Pacientes virtuales con historias realistas y distintos niveles de desafío.</p>
        </article>
        <article className="feature-card">
          <Sparkles aria-hidden="true" />
          <h2>Feedback formativo</h2>
          <p>Recibe orientación para fortalecer tu escucha, tus preguntas y tu cierre.</p>
        </article>
        <article className="feature-card">
          <ShieldCheck aria-hidden="true" />
          <h2>Práctica segura</h2>
          <p>Entrena habilidades de entrevista en un entorno ético y controlado.</p>
        </article>
      </div>

      <article className="writing-guidance-card">
        <MessageSquareText aria-hidden="true" />
        <div>
          <h2>Practica con calma. Aprende con criterio.</h2>
          <p>
            Tómate un momento para formular preguntas respetuosas, precisas y abiertas.
            La calidad de una entrevista también se construye en la manera de escuchar
            y de invitar a la otra persona a expresarse.
          </p>
          <span>
            Cada práctica puede ayudarte a desarrollar criterio clínico inicial y una
            escritura profesional más cuidadosa.
          </span>
        </div>
      </article>

      <section className="podcast-section" aria-labelledby="podcast-title">
        <div className="podcast-copy">
          <span className="podcast-eyebrow"><Headphones aria-hidden="true" /> Contenido Núcleo Vivo</span>
          <h2 id="podcast-title">Podcast Núcleo Vivo</h2>
          <p>Conversaciones sobre bienestar, cultura, vínculos y desarrollo humano.</p>
          <a
            className="secondary-action podcast-action"
            href="https://open.spotify.com/show/033sQIGbzXamAjYqMuTAyU"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Spotify
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
        <iframe
          className="spotify-embed"
          src="https://open.spotify.com/embed/show/033sQIGbzXamAjYqMuTAyU?utm_source=generator"
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Podcast Núcleo Vivo en Spotify"
        />
      </section>
    </section>
  );
}
