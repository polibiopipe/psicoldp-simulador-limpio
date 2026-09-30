import React, { useRef, useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { SeminarTeamWorkspace } from './SeminarTeamWorkspace.jsx';
import { ResearchLearningWorkspace } from './ResearchLearningWorkspace.jsx';

export function CollaborativeSeminarShell({ session, onSignOut, frameRef, seminarDocument }) {
  const [view, setView] = useState('learn');
  const [importedDraft, setImportedDraft] = useState(null);
  const [requestedLesson, setRequestedLesson] = useState(null);
  const panels = useRef({});
  const learningPosition = useRef(0);
  function openSupport(next) {
    if (view === 'learn') learningPosition.current = globalThis.scrollY || 0;
    setView(next);
    globalThis.requestAnimationFrame?.(() => {
      panels.current[next]?.focus({ preventScroll: true });
      globalThis.scrollTo?.({ top: next === 'learn' ? learningPosition.current : 0, behavior: 'instant' });
    });
  }
  return <main className="seminar-standalone-shell">
    <header className="seminar-session-bar">
      <div><strong>Simulador de tesis</strong><span>PsicoLDP · Aprender investigando</span></div>
      <div><span>{session.user.email}</span><button type="button" onClick={onSignOut}><LogOut aria-hidden="true"/> Cerrar sesión</button></div>
    </header>
    {view !== 'learn' && <div className="seminar-support-return"><button type="button" onClick={() => openSupport('learn')}><ArrowLeft aria-hidden="true"/> Volver a construir mi tesis</button><p>{view === 'team' ? 'Revisa tu desarrollo con el equipo y vuelve al apartado para incorporar lo aprendido.' : 'Consulta tus fechas y registros anteriores; continúa la construcción desde tu tesis.'}</p></div>}
    <div ref={node => { panels.current.learn = node; }} tabIndex={-1} id="seminar-learn-panel" className="seminar-mode-panel" role="region" aria-label="Construir mi tesis" hidden={view !== 'learn'}>
      <ResearchLearningWorkspace key={session.user.id} session={session} requestedLesson={requestedLesson} onOpenTeam={() => openSupport('team')} onOpenArchive={() => openSupport('guide')} onShare={draft => { setImportedDraft(draft); openSupport('team'); }}/>
    </div>
    <div ref={node => { panels.current.team = node; }} tabIndex={-1} id="seminar-team-panel" className="seminar-mode-panel" role="region" aria-label="Revisión de mi tesis con el equipo" hidden={view !== 'team'}>
      <SeminarTeamWorkspace key={session.user.id} session={session} importedDraft={importedDraft} onOpenLearning={id => { setRequestedLesson({ id, requestId: globalThis.crypto.randomUUID() }); setView('learn'); }} onOpenGuide={() => openSupport('learn')}/>
    </div>
    <div ref={node => { panels.current.guide = node; }} tabIndex={-1} id="seminar-guide-panel" className="seminar-mode-panel" role="region" aria-label="Consulta de calendario y archivo" hidden={view !== 'guide'}>
      <p className="seminar-team-local-caption">Este archivo acompaña la ruta única del proyecto y conserva sus actividades y los borradores de este navegador. Estos registros anteriores no se publican ni se atribuyen automáticamente a una persona. Para compartir un desarrollo, copia el contenido pertinente en un nuevo aporte de la mesa del equipo y enlaza su evidencia.</p>
      <iframe ref={frameRef} className="seminar-standalone-frame" srcDoc={seminarDocument} title="Ruta de Seminario · Guía y borradores anteriores"/>
    </div>
  </main>;
}
