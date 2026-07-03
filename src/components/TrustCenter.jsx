import React, { useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  LifeBuoy,
  LockKeyhole,
  Scale,
  ShieldCheck
} from "lucide-react";

const tabs = [
  {
    id: "privacidad",
    label: "Privacidad",
    icon: LockKeyhole,
    title: "Privacidad desde el diseno",
    intro: "Datos minimizados, finalidad formativa y controles claros para usuarios e instituciones.",
    points: [
      "Uso exclusivo para simulacion educativa.",
      "Recomendacion explicita: no ingresar datos reales de pacientes.",
      "Derechos del titular preparados para acceso, correccion, eliminacion o bloqueo."
    ]
  },
  {
    id: "seguridad",
    label: "Seguridad",
    icon: ShieldCheck,
    title: "Seguridad operacional",
    intro: "Arquitectura preparada para control de acceso, trazabilidad y resguardo de sesiones.",
    points: [
      "Acceso con cuenta y aprobacion manual.",
      "Separacion entre usuarios, sesiones y perfiles.",
      "Base para registro de accesos, incidentes y administracion futura."
    ]
  },
  {
    id: "ia",
    label: "Uso responsable de IA",
    icon: BrainCircuit,
    title: "IA formativa, no atencion clinica",
    intro: "Pacientes simulados asistidos por IA para entrenar criterio, escucha y habilidades iniciales.",
    points: [
      "No reemplaza atencion profesional de salud mental.",
      "No debe usarse para diagnostico, tratamiento o supervision clinica real.",
      "Las respuestas se orientan a aprendizaje y retroalimentacion formativa."
    ]
  },
  {
    id: "chile",
    label: "Cumplimiento Chile",
    icon: Scale,
    title: "Base normativa chilena",
    intro: "Marco de referencia para privacidad, salud digital y uso responsable de tecnologia.",
    sections: [
      {
        title: "Ley 19.628",
        text: "Tratamiento de datos personales y sensibles, finalidad, deber de confidencialidad y derechos de acceso, rectificacion, cancelacion o bloqueo."
      },
      {
        title: "Ley 20.584",
        text: "Trato digno, privacidad, informacion comprensible, seguridad en la atencion y resguardo en el uso de tecnologias."
      }
    ]
  },
  {
    id: "internacional",
    label: "Internacional",
    icon: Globe2,
    title: "Preparacion internacional",
    intro: "Enfoque privacy-first, compliance-ready y jurisdiction-aware, sin prometer cumplimiento universal.",
    sections: [
      {
        title: "GDPR",
        text: "Transparencia, minimizacion, limitacion de finalidad, derechos del usuario, seguridad y control del tratamiento."
      },
      {
        title: "CCPA / CPRA",
        text: "Derecho a saber, eliminar, corregir, avisos al recolectar datos y no discriminacion por ejercer derechos."
      },
      {
        title: "LGPD",
        text: "Base legal, finalidad, necesidad, derechos del titular y medidas de seguridad proporcionales."
      }
    ]
  },
  {
    id: "terminos",
    label: "Terminos",
    icon: FileText,
    title: "Politicas y condiciones",
    intro: "Estructura documental lista para crecer con clientes, instituciones y nuevos modulos.",
    policies: [
      "Politica de privacidad",
      "Terminos y condiciones",
      "Politica de tratamiento de datos",
      "Politica de seguridad de la informacion",
      "Politica de uso responsable de IA",
      "Retencion y eliminacion de datos",
      "Politica de cookies, si aplica",
      "Procedimiento de derechos del titular",
      "Procedimiento de incidentes y contacto de seguridad"
    ]
  },
  {
    id: "datos",
    label: "Gestion de datos",
    icon: Database,
    title: "Gestion responsable de datos",
    intro: "Controles preparados para ciclo de vida, acceso, exportacion y eliminacion de informacion.",
    points: [
      "Sesiones guardadas asociadas a usuario autenticado.",
      "Base para exportacion o eliminacion a solicitud del titular.",
      "Advertencia permanente para no ingresar informacion sensible de terceros."
    ]
  },
  {
    id: "contacto",
    label: "Soporte",
    icon: LifeBuoy,
    title: "Contacto y soporte",
    intro: "Canal institucional para privacidad, seguridad, soporte y solicitudes de acceso.",
    points: [
      "Contacto: contacto@nucleovivo.net",
      "Sitio institucional: nucleovivo.net",
      "Futuro: area de administracion, roles y trazabilidad ampliada."
    ]
  }
];

export function TrustCenter({ onBack }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const ActiveIcon = active.icon;

  return (
    <section className="screen trust-center-screen">
      <button className="secondary-action trust-back-action" type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        Volver
      </button>

      <header className="trust-hero">
        <span className="eyebrow">Nucleo Vivo Trust Center</span>
        <h1>Centro de confianza y cumplimiento</h1>
        <p>
          Privacidad, seguridad, etica y cumplimiento para una formacion responsable
          con pacientes simulados.
        </p>
        <div className="trust-chip-row" aria-label="Principios de confianza">
          <span>privacy-first</span>
          <span>compliance-ready</span>
          <span>jurisdiction-aware</span>
          <span>uso formativo</span>
        </div>
      </header>

      <div className="trust-layout">
        <nav className="trust-tabs" aria-label="Secciones de confianza">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={tab.id === activeTab ? "selected" : ""}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <article className="trust-panel">
          <div className="trust-panel-heading">
            <span><ActiveIcon aria-hidden="true" /></span>
            <div>
              <h2>{active.title}</h2>
              <p>{active.intro}</p>
            </div>
          </div>

          {active.points && (
            <div className="trust-point-grid">
              {active.points.map((point) => (
                <div className="trust-point" key={point}>
                  <CheckCircle2 aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}

          {active.sections && (
            <div className="trust-section-grid">
              {active.sections.map((section) => (
                <section key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.text}</p>
                </section>
              ))}
            </div>
          )}

          {active.policies && (
            <div className="policy-grid" aria-label="Politicas base">
              {active.policies.map((policy) => (
                <article key={policy}>
                  <FileText aria-hidden="true" />
                  <span>{policy}</span>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>

      <aside className="trust-legal-note">
        <strong>Nota normativa</strong>
        <p>
          La adecuacion normativa final puede variar segun el pais, tipo de cliente
          y modalidad de uso contratada.
        </p>
      </aside>

      <section className="trust-disclaimer-grid" aria-label="Avisos clave">
        <article>
          <ShieldCheck aria-hidden="true" />
          <h2>Entorno simulado</h2>
          <p>
            Pacientes ficticios asistidos por IA con fines formativos. No constituye
            atencion clinica real.
          </p>
        </article>
        <article>
          <LockKeyhole aria-hidden="true" />
          <h2>Datos reales</h2>
          <p>
            No ingreses informacion identificable ni datos sensibles de pacientes
            reales dentro de las practicas.
          </p>
        </article>
        <article>
          <LifeBuoy aria-hidden="true" />
          <h2>Riesgo vital</h2>
          <p>
            Ante riesgo vital o emergencia de salud mental, acude a servicios de
            emergencia o redes profesionales disponibles.
          </p>
        </article>
      </section>

      <div className="trust-contact-strip">
        <span>Soporte institucional y seguridad</span>
        <a href="mailto:contacto@nucleovivo.net">contacto@nucleovivo.net</a>
        <a href="https://nucleovivo.net/" target="_blank" rel="noopener noreferrer">
          Nucleo Vivo
          <ExternalLink aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
