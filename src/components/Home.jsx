import React from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  FolderClock,
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
            Entrena entrevistas iniciales en un entorno formativo, ético y humano.
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

          <div className="hero-value-list" aria-label="Valores de la experiencia formativa">
            <span><ShieldCheck aria-hidden="true" /> Práctica segura</span>
            <span><Sprout aria-hidden="true" /> Aprendizaje progresivo</span>
            <span><HeartHandshake aria-hidden="true" /> Formación humana</span>
            <span><Compass aria-hidden="true" /> Escucha y criterio</span>
          </div>

          <div className="hero-actions">
            <button className="primary-action landing-primary" type="button" onClick={onStart}>
              Comenzar entrevista
              <ArrowRight aria-hidden="true" />
            </button>
            <button className="secondary-action landing-secondary" type="button" onClick={onStart}>
              <Play aria-hidden="true" />
              Ver cómo funciona
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
              <strong>VivoLab · Entrevista Inicial</strong>
            </div>

            <div className="preview-patient">
              <div className="preview-avatar">
                <img src="/casos/tomas.png" alt="Retrato ficticio de Tomás" />
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
              <img src="/casos/camila.png" alt="Retrato ficticio de Camila" />
              <div><strong>Camila, 29</strong><span>Límites y sobrecarga</span></div>
            </article>
            <article>
              <img src="/casos/marcos.png" alt="Retrato ficticio de Marcos" />
              <div><strong>Marcos, 38</strong><span>Estrés laboral</span></div>
            </article>
            <article>
              <img src="/casos/elena.png" alt="Retrato ficticio de Elena" />
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
          <h2>Respuestas más humanas</h2>
          <p>Desarrolla habilidades con empatía, ética y foco en la persona.</p>
        </article>
      </div>

      <article className="writing-guidance-card">
        <MessageSquareText aria-hidden="true" />
        <div>
          <h2>Entrena una forma de preguntar más clara y humana</h2>
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
    </section>
  );
}
