import React from "react";
import {
  CalendarClock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UsersRound
} from "lucide-react";

const navItems = [
  { id: "home", label: "Inicio", icon: LayoutDashboard },
  { id: "select", label: "Pacientes", icon: UsersRound },
  { id: "clinicalAgenda", label: "Agenda", icon: CalendarClock },
  { id: "savedSessions", label: "Sesiones", icon: FileText },
  { id: "results", label: "Cierre y evaluación", icon: ClipboardCheck },
  { id: "trustCenter", label: "Consentimiento", icon: ShieldCheck }
];

export function AuthenticatedLayout({
  children,
  currentScreen,
  userEmail,
  isLocalMode = false,
  hasEvaluation = false,
  navigationBusy = false,
  onNavigate,
  onSignOut
}) {
  const userLabel = isLocalMode ? "Modo local" : userEmail || "Usuario";

  return (
    <div className="authenticated-workspace">
      <aside className="workspace-sidebar" aria-label="Navegacion interna">
        <div className="workspace-brand">
          <img src="/logo-escucha-viva-horizontal.png" alt="Escucha Viva" />
          <span>Simuladores formativos</span>
        </div>

        <nav className="workspace-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = navigationBusy || (item.id === "results" && !hasEvaluation);
            const isActive = currentScreen === item.id ||
              (item.id === "select" && ["brief", "simulation"].includes(currentScreen));
            return (
              <button
                key={item.id}
                className={isActive ? "active" : ""}
                type="button"
                onClick={() => onNavigate(item.id)}
                disabled={isDisabled}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="workspace-sidebar-note">
          <strong>Entorno formativo</strong>
          <span>Pacientes ficticios, privacidad y uso responsable.</span>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <span className="eyebrow">Escucha Viva</span>
            <strong>Plataforma clinica formativa</strong>
          </div>
          <div className="workspace-user">
            <span>{userLabel}</span>
            {!isLocalMode && (
              <button className="workspace-signout" type="button" onClick={onSignOut} disabled={navigationBusy}>
                <LogOut aria-hidden="true" />
                Cerrar sesion
              </button>
            )}
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </section>
    </div>
  );
}
