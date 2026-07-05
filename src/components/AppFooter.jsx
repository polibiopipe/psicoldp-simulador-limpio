import React from "react";

const footerLinks = [
  "Privacidad",
  "Terminos"
];

export function AppFooter({ onOpenTrust }) {
  return (
    <footer className="app-footer" aria-label="Informacion institucional">
      <div>
        <strong>Escucha Viva</strong>
      </div>
      <nav aria-label="Centro de confianza">
        {footerLinks.map((label) => (
          <button key={label} type="button" onClick={onOpenTrust}>
            {label}
          </button>
        ))}
        <a href="mailto:contacto@nucleovivo.net">Contacto</a>
      </nav>
    </footer>
  );
}
