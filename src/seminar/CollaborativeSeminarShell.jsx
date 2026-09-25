import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { SeminarTeamWorkspace } from './SeminarTeamWorkspace.jsx';

export function CollaborativeSeminarShell({ session, onSignOut, frameRef, seminarDocument }) {
  const [view, setView] = useState('team');
  return <main className="seminar-standalone-shell">
    <header className="seminar-session-bar">
      <div><strong>Ruta de Seminario</strong><span>PsicoLDP · Investigación colaborativa</span></div>
      <div><span>{session.user.email}</span><button type="button" onClick={onSignOut}><LogOut aria-hidden="true"/> Cerrar sesión</button></div>
    </header>
    <nav className="seminar-mode-tabs" role="tablist" aria-label="Espacios del seminario">
      <button id="seminar-team-tab" type="button" role="tab" aria-controls="seminar-team-panel" aria-selected={view === 'team'} onClick={() => setView('team')}>Mesa del equipo · XP</button>
      <button id="seminar-guide-tab" type="button" role="tab" aria-controls="seminar-guide-panel" aria-selected={view === 'guide'} onClick={() => setView('guide')}>Guía y borradores anteriores</button>
    </nav>
    <div id="seminar-team-panel" className="seminar-mode-panel" role="tabpanel" aria-labelledby="seminar-team-tab" hidden={view !== 'team'}>
      <SeminarTeamWorkspace key={session.user.id} session={session} onOpenGuide={() => setView('guide')}/>
    </div>
    <div id="seminar-guide-panel" className="seminar-mode-panel" role="tabpanel" aria-labelledby="seminar-guide-tab" hidden={view !== 'guide'}>
      <p className="seminar-team-local-caption">La guía conserva sus actividades y los borradores de este navegador. Estos registros anteriores no se publican ni se atribuyen automáticamente a una persona. Para compartir un desarrollo, copia el contenido pertinente en un nuevo aporte de la mesa del equipo y enlaza su evidencia.</p>
      <iframe ref={frameRef} className="seminar-standalone-frame" srcDoc={seminarDocument} title="Ruta de Seminario · Guía y borradores anteriores"/>
    </div>
  </main>;
}
