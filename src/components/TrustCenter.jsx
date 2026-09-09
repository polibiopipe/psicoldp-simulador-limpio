import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, BrainCircuit, Download, FileCheck2, LockKeyhole, Scale } from "lucide-react";
import { AccessConsentSummary } from "./AccessConsentGate.jsx";
import { ResearchConsent } from "./ResearchConsent.jsx";
import { exportOwnSimulatorData } from "../engine/researchConsent.js";
import { downloadTextFile, PRIVACY_CONTACT } from "../data/researchConsent.js";

const tabs = [
  { id: "consentimiento", label: "Consentimiento", icon: FileCheck2 },
  { id: "datos", label: "Mis datos y privacidad", icon: LockKeyhole },
  { id: "ia", label: "Inteligencia artificial", icon: BrainCircuit },
  { id: "normativa", label: "Marco de protección", icon: Scale }
];

export function TrustCenter({ onBack, userId = "", canParticipate = true, onBusyChange }) {
  const [activeTab, setActiveTab] = useState("consentimiento");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const downloading = useRef(false);
  const callback = useRef(onBusyChange);
  callback.current = onBusyChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; callback.current?.(false); }; }, []);
  function changeBusy(value) { setBusy(value); callback.current?.(value); }
  async function downloadData() {
    if (downloading.current) return;
    downloading.current = true;
    changeBusy(true);
    setError("");
    try {
      const data = await exportOwnSimulatorData(userId);
      if (mounted.current) downloadTextFile("escucha-viva-mis-datos.json", JSON.stringify(data, null, 2), "application/json");
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { downloading.current = false; if (mounted.current) changeBusy(false); }
  }
  return <section className="screen trust-center-screen">
    <button className="secondary-action trust-back-action" type="button" disabled={busy} onClick={onBack}><ArrowLeft aria-hidden="true" />Volver</button>
    <header className="trust-hero"><span className="eyebrow">Escucha Viva</span><h1>Privacidad y consentimiento</h1>
      <p>Conoce qué se guarda, decide sobre tu participación en investigaciones y gestiona tus datos.</p></header>
    <div className="trust-layout">
      <nav className="trust-tabs" aria-label="Secciones de privacidad">{tabs.map(({ id, label, icon: Icon }) =>
        <button key={id} type="button" className={activeTab === id ? "selected" : ""} aria-current={activeTab === id ? "page" : undefined} disabled={busy} onClick={() => setActiveTab(id)}><Icon aria-hidden="true" />{label}</button>
      )}</nav>
      <article className="trust-panel consent-panel">
        {activeTab === "consentimiento" && <><AccessConsentSummary key={`access-${userId || "public"}`} userId={userId} /><ResearchConsent key={userId || "public"} userId={userId} canParticipate={canParticipate} onBusyChange={changeBusy} /></>}
        {activeTab === "datos" && <>
          <h2>Tus datos en el simulador</h2>
          <p>La cuenta utiliza tu nombre y correo. Las citas, disponibilidad, conversaciones, preparación, cierres y resultados de práctica se asocian a tu usuario para guardar y retomar el trabajo. Estos registros son identificables.</p>
          <h3>Almacenamiento y acceso</h3>
          <p>La base de datos y autenticación se gestionan en Supabase, en la región Este de Estados Unidos. Vercel aloja la aplicación y procesa sus solicitudes. Algunas funciones mantienen borradores y copias de trabajo en el navegador de este dispositivo.</p>
          <p>Tu cuenta consulta sus propios registros. El personal que administra la infraestructura puede tener acceso técnico para soporte y gestión. La participación en un estudio debe informar, además, quién accederá a sus datos y con qué finalidad.</p>
          <h3>Conservación y solicitudes</h3>
          <p>Las sesiones permanecen en tu historial hasta que las elimines desde «Sesiones» o solicites su gestión. El retiro de una investigación se registra por separado y no borra ese historial. El plazo y la gestión de respaldos y copias del estudio deben indicarse en su consentimiento.</p>
          <p>Puedes solicitar acceso, rectificación, eliminación u otra gestión de tus datos al contacto de privacidad. Indica el tipo de solicitud y el correo de tu cuenta; evita incluir contraseñas o antecedentes clínicos.</p>
          <div className="consent-actions">
            {userId && canParticipate && <button className="secondary-action" type="button" disabled={busy} onClick={() => void downloadData()}><Download aria-hidden="true" />{busy ? "Preparando copia…" : "Descargar mis datos"}</button>}
            <a className="secondary-action" href={`mailto:${PRIVACY_CONTACT}?subject=Solicitud%20sobre%20mis%20datos%20en%20Escucha%20Viva`}>Solicitar gestión de mis datos</a>
          </div>
          {error && <p role="alert" className="consent-error">{error}</p>}
          <p className="consent-small">La descarga incluye los registros de tu cuenta disponibles en la base de datos. Para borradores del dispositivo, registros técnicos, respaldos u otras copias, utiliza el contacto de privacidad. El enlace de solicitud abre tu aplicación de correo; debes enviar el mensaje para cursarla.</p>
        </>}
        {activeTab === "ia" && <>
          <h2>Cómo interviene la IA</h2>
          <p>Google Gemini genera respuestas de los personajes a partir del mensaje que escribes, el contexto de la conversación y el caso ficticio. Estas solicitudes se procesan a través del servidor de Escucha Viva. Cuando corresponde, el simulador puede utilizar respuestas locales.</p>
          <p>La IA puede producir información incorrecta o poco pertinente. Las respuestas y la retroalimentación apoyan la práctica; no constituyen atención clínica ni una evaluación definitiva de tu competencia profesional.</p>
          <h3>Qué información evitar</h3>
          <p>Trabaja con los casos ficticios. No incluyas nombres ni antecedentes de pacientes reales, ni información sobre tu propia salud. Este módulo de consentimiento no autoriza grabaciones de audio, video o biometría.</p>
          <h3>Información para una investigación</h3>
          <p>Antes de abrir un estudio, su información debe precisar los proveedores, destinatarios, condiciones de conservación y garantías para el tratamiento fuera de Chile. El consentimiento del estudio no incluye una autorización general para entrenar modelos.</p>
        </>}
        {activeTab === "normativa" && <>
          <h2>Protección de datos en Chile</h2>
          <p>La Ley 19.628 regula el tratamiento de datos personales. La Ley 21.719 reforma ese marco y contempla obligaciones de transparencia, seguridad y protección desde el diseño, junto con derechos de las personas sobre sus datos.</p>
          <p>El consentimiento de cada estudio debe corresponder a su protocolo y a la normativa aplicable al momento de realizarlo. La revisión institucional, los acuerdos con proveedores y las medidas operativas forman parte de esa preparación.</p>
          <div className="consent-actions"><a href="https://www.bcn.cl/leychile/navegar?idNorma=141599" target="_blank" rel="noopener noreferrer">Consultar Ley 19.628</a>
            <a href="https://www.bcn.cl/leychile/navegar?idNorma=1209272" target="_blank" rel="noopener noreferrer">Consultar Ley 21.719</a></div>
          <p>Para consultar el procedimiento institucional y los modelos de consentimiento, puedes revisar los <a href="https://www.uniacc.cl/investigacion/documentos/" target="_blank" rel="noopener noreferrer">documentos del Comité Ético Científico de UNIACC</a>. Este enlace no implica aprobación del simulador ni de un estudio.</p>
        </>}
      </article>
    </div>
    <div className="trust-contact-strip"><span>Privacidad y soporte · Núcleo Vivo</span><a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a></div>
  </section>;
}
