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
        <small className="app-footer-legal">
          © 2026 Núcleo Vivo. Simulador formativo en desarrollo. Todos los derechos reservados.
        </small>
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
