import React from "react";

const footerLinks = [
  "Privacidad",
  "Terminos",
  "Seguridad",
  "Uso responsable de IA",
  "Cumplimiento"
];

export function AppFooter({ onOpenTrust }) {
  return (
    <footer className="app-footer" aria-label="Informacion institucional">
      <div>
        <strong>Escucha Viva</strong>
        <span>Simuladores formativos</span>
      </div>
      <nav aria-label="Centro de confianza">
        {footerLinks.map((label) => (
          <button key={label} type="button" onClick={onOpenTrust}>
            {label}
          </button>
        ))}
        <a href="mailto:contacto@nucleovivo.net">Contacto</a>
      </nav>
      <a
        className="footer-parent-brand"
        href="https://nucleovivo.net/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Una iniciativa de Nucleo Vivo
      </a>
    </footer>
  );
}
