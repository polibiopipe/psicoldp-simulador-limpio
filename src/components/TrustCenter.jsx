import React, { useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  LifeBuoy,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";

const tabs = [
  {
    id: "privacidad", label: "Privacidad", icon: LockKeyhole,
    title: "Qué información utiliza Escucha Viva",
    intro: "La plataforma es una iniciativa educativa de Núcleo Vivo. Practica únicamente con los casos ficticios disponibles.",
    sections: [
      { title: "Cuenta y prácticas", text: "Se utilizan tu correo y los datos de tu cuenta para gestionar el acceso. Las prácticas guardadas incluyen el caso, la preparación, la agenda, las intervenciones escritas, las respuestas simuladas y la retroalimentación." },
      { title: "Servicios que intervienen", text: "Supabase gestiona la autenticación y los registros. Cuando está configurado, Google Gemini recibe el mensaje y contexto de la práctica para generar la respuesta ficticia. El circuito de aprobación puede enviar notificaciones por correo mediante Resend." },
      { title: "Tu navegador", text: "El navegador puede conservar la sesión de acceso, borradores, preferencias e historial local. El dictado es opcional, requiere permiso de micrófono y depende del servicio de reconocimiento de voz de tu navegador. Revisa sus condiciones antes de utilizarlo." },
      { title: "Información que debes excluir", text: "No escribas nombres, antecedentes clínicos ni otros datos identificables de pacientes reales o terceros. Los proveedores tienen sus propias condiciones de tratamiento; esta página no garantiza una ubicación única de los datos ni su uso exclusivo dentro de Chile." }
    ]
  },
  {
    id: "seguridad", label: "Acceso y seguridad", icon: ShieldCheck,
    title: "Acceso a tus prácticas", intro: "La versión publicada requiere una cuenta y aprobación de acceso.",
    points: ["Las prácticas se asocian al usuario autenticado y se consultan con controles de acceso.", "No compartas tu contraseña. Cierra la sesión en equipos compartidos.", "Si observas información de otra cuenta o un acceso inesperado, informa a contacto@nucleovivo.net sin adjuntar datos sensibles."]
  },
  {
    id: "ia", label: "Simulación e IA", icon: BrainCircuit,
    title: "Cómo interpretar la simulación", intro: "Entrenamiento de entrevista con 15 pacientes ficticios adultos.",
    sections: [
      { title: "Respuestas", text: "La conversación combina perfiles definidos, reglas locales y, cuando está disponible, generación con IA. Puede cometer errores o producir respuestas repetidas. Si detectas una contradicción, consérvala como observación para revisión docente." },
      { title: "Retroalimentación", text: "Los indicadores describen patrones observados en la práctica. No son una evaluación clínica, un instrumento psicométrico validado ni una certificación de competencia profesional. Deben interpretarse con acompañamiento docente." },
      { title: "Formato de entrevista", text: "La entrevista se realiza por texto, con dictado opcional para escribir. El retrato representa al personaje ficticio. El tiempo y el número de intervenciones describen el uso de la sesión; no miden el aprendizaje." }
    ]
  },
  {
    id: "terminos", label: "Condiciones de uso", icon: FileText,
    title: "Condiciones de la práctica", intro: "Utiliza Escucha Viva como espacio de formación y ensayo de habilidades de entrevista.",
    sections: [
      { title: "Finalidad", text: "El simulador no presta atención psicológica, diagnóstico ni tratamiento. No debe utilizarse para tomar decisiones sobre pacientes reales ni como servicio de emergencias." },
      { title: "Uso de la cuenta", text: "Usa tu propia cuenta autorizada, respeta el acceso de otros usuarios y no introduzcas información confidencial de terceros. Las sesiones y los casos representan situaciones ficticias." },
      { title: "Duración y continuidad", text: "Cada entrevista dispone de hasta 45 minutos y un límite técnico de 60 intervenciones. El tiempo comienza al iniciar la práctica y continúa aunque cierres la página. Al finalizar puedes completar el cierre y revisar la retroalimentación. El proceso permite planificar entre 1 y 12 sesiones." },
      { title: "Disponibilidad", text: "La generación de respuestas, el dictado y el guardado dependen de la conexión y de los servicios disponibles. Revisa los mensajes de error y utiliza la opción de reintento cuando aparezca. El contenido de la simulación puede actualizarse para corregir errores y mejorar la formación." }
    ]
  },
  {
    id: "datos", label: "Tus datos y progreso", icon: Database,
    title: "Consulta, conservación y solicitudes", intro: "Puedes revisar tus prácticas guardadas y tus indicadores personales desde tu cuenta.",
    sections: [
      { title: "Consulta y exportación", text: "Sesiones guardadas permite retomar o revisar las prácticas disponibles. Estadísticas muestra tus indicadores y permite descargar un CSV. La retroalimentación también ofrece descarga de resultados en texto. Estas exportaciones tienen alcances distintos y no constituyen una copia completa de todos los datos de la cuenta." },
      { title: "Conservación", text: "La aplicación no tiene implementado un borrado automático de prácticas por antigüedad. Cerrar sesión o borrar datos del navegador no elimina los registros guardados en el servidor." },
      { title: "Acceso, corrección o eliminación", text: "Solicita acceso, corrección o eliminación escribiendo a contacto@nucleovivo.net desde el correo de tu cuenta. Indica qué información o práctica deseas revisar. La solicitud requiere verificar la titularidad; no envíes tu contraseña ni información clínica real. La gestión se realiza por contacto, sin un botón de eliminación automática en esta pantalla." },
      { title: "Investigación", text: "Los indicadores personales apoyan tu aprendizaje. El módulo de investigación permanece desactivado por defecto y requiere configuración institucional, un protocolo y consentimiento específico cuando corresponda. Una cuenta aprobada no equivale a consentir la participación en una tesis." }
    ]
  },
  {
    id: "contacto", label: "Soporte", icon: LifeBuoy,
    title: "Contacto de Núcleo Vivo", intro: "Escribe a contacto@nucleovivo.net para soporte, privacidad o incidentes.",
    points: ["Describe la pantalla y lo que ocurrió; indica la fecha aproximada y el caso ficticio.", "No adjuntes contraseñas, credenciales ni datos de pacientes reales.", "Para emergencias personales, utiliza los servicios de emergencia y atención profesional disponibles en tu localidad."]
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
        <span className="eyebrow">Escucha Viva · Núcleo Vivo</span>
        <h1>Privacidad y condiciones de uso</h1>
        <p>
          Información sobre tu cuenta, tus prácticas y el funcionamiento de la simulación.
        </p>
        <div className="trust-chip-row" aria-label="Principios de confianza">
          <span>Casos ficticios</span>
          <span>Uso educativo</span>
          <span>Acceso personal</span>
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
                aria-current={tab.id === activeTab ? "page" : undefined}
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


        </article>
      </div>



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
