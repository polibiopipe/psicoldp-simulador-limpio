import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { TEAM_KEY, TEAM_ACTIVITIES, REVIEW_CHECKS, editableItem, blankItem, validateItem, reviewState, canReview, safeEvidenceUrl, readableTeamError } from './seminarTeamModel.js';
import './seminarTeam.css';

async function allRows(makeQuery) {
  const rows = [];
  for (let offset = 0; offset < 50000; offset += 500) {
    const { data, error } = await makeQuery().range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
  throw new Error('El registro es muy extenso. No se mostrará como completo una carga parcial.');
}
function localKey(user, item) { return `seminar-team-draft:${user}:${item.id || `new-${item.kind}`}`; }
function readDraft(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value && typeof value.content === 'object' && !Array.isArray(value.content) ? editableItem(value) : null; }
  catch { return null; }
}
function timestamp(value) { return value ? new Date(value).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : ''; }
const EVENT_NAMES = { revision: 'Guardó una versión', comment: 'Aportó al contraste', review_approved: 'Registró revisión favorable', review_changes: 'Solicitó ajustes', agree: 'Confirmó su acuerdo', object: 'Dejó una objeción' };

export function SeminarTeamWorkspace({ session, importedDraft, onOpenGuide }) {
  const userId = session.user.id;
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);
  const [connection, setConnection] = useState('Conectando con el equipo…');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [note, setNote] = useState('');
  const [action, setAction] = useState('comment');
  const [checks, setChecks] = useState([false, false, false, false]);
  const [filter, setFilter] = useState('all');
  const selectedRef = useRef(null);
  const active = useRef(true);
  const requestNumber = useRef(0);
  const importedId = useRef(null);
  const formRef = useRef(null);
  const item = items.find(row => row.id === selectedId) || null;
  const remoteChanged = !!item && !!draft && item.revision !== draft.revision;
  const status = useMemo(() => reviewState(item, events, members), [item, events, members]);
  const name = id => members.find(m => m.user_id === id)?.display_name || 'Integrante';

  const loadEvents = useCallback(async id => {
    if (!id) { setEvents([]); return; }
    setEventLoading(true);
    try {
      const rows = await allRows(() => supabase.from('seminar_events').select('*').eq('team_key', TEAM_KEY).eq('item_id', id).order('created_at', { ascending: false }).order('id'));
      if (active.current && selectedRef.current === id) setEvents(rows);
    } catch (err) { if (active.current) setError(readableTeamError(err)); }
    finally { if (active.current && selectedRef.current === id) setEventLoading(false); }
  }, []);

  const refresh = useCallback(async () => {
    const request = ++requestNumber.current;
    try {
      const [roster, shared] = await Promise.all([
        allRows(() => supabase.from('seminar_members').select('team_key,user_id,display_name,active').eq('team_key', TEAM_KEY).eq('active', true).order('display_name')),
        allRows(() => supabase.from('seminar_items').select('*').eq('team_key', TEAM_KEY).order('updated_at', { ascending: false }).order('id'))
      ]);
      if (!active.current || request !== requestNumber.current) return;
      if (!roster.some(m => m.user_id === userId)) {
        setMembers([]); setItems([]); setEvents([]);
        throw new Error('Tu cuenta no tiene una membresía activa en este equipo.');
      }
      setMembers(roster); setItems(shared); setLoading(false);
      if (selectedRef.current) void loadEvents(selectedRef.current);
    } catch (err) {
      if (active.current && request === requestNumber.current) {
        setLoading(false); setError(readableTeamError(err));
        setConnection('No se pudo actualizar el espacio compartido');
      }
    }
  }, [userId, loadEvents]);

  useEffect(() => {
    active.current = true;
    void refresh();
    const channel = supabase.channel(`seminar-team-${TEAM_KEY}-${userId}`);
    ['seminar_items', 'seminar_events', 'seminar_members'].forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `team_key=eq.${TEAM_KEY}` }, () => void refresh());
    });
    channel.subscribe(state => {
      if (active.current) setConnection(state === 'SUBSCRIBED' ? 'Cambios del equipo sincronizados en tiempo real' : 'Sincronización periódica disponible');
    });
    const timer = globalThis.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    const focus = () => void refresh();
    globalThis.addEventListener('focus', focus);
    return () => { active.current = false; globalThis.clearInterval(timer); globalThis.removeEventListener('focus', focus); void supabase.removeChannel(channel); };
  }, [refresh, userId]);

  useEffect(() => {
    selectedRef.current = selectedId;
    setNote(''); setAction('comment'); setChecks([false, false, false, false]);
    void loadEvents(selectedId);
  }, [selectedId, loadEvents]);

  useEffect(() => {
    if (!draft || !dirty) return;
    try { localStorage.setItem(localKey(userId, draft), JSON.stringify(draft)); }
    catch { setError('El navegador no pudo conservar una copia local. Mantén esta página abierta y guarda el aporte cuando haya conexión.'); }
  }, [draft, dirty, userId]);

  useEffect(() => {
    if (!dirty) return undefined;
    const leave = event => { event.preventDefault(); event.returnValue = ''; };
    globalThis.addEventListener('beforeunload', leave);
    return () => globalThis.removeEventListener('beforeunload', leave);
  }, [dirty]);

  useEffect(() => {
    if (!importedDraft || importedId.current === importedDraft.requestId || !members.length) return;
    importedId.current = importedDraft.requestId;
    const initial = blankItem('aporte', userId, members);
    initial.title = String(importedDraft.title || 'Aporte desde la ruta').slice(0, 180);
    initial.stage_key = String(importedDraft.stage || '').slice(0, 160);
    initial.evidence_url = safeEvidenceUrl(importedDraft.evidence);
    initial.content = { development: String(importedDraft.development || '').slice(0, 60000), reason: '', learning: '', origin: 'Copia voluntaria de un borrador local de la guía. Su origen y sus afirmaciones deben revisarse antes del cierre.' };
    // Keep any in-progress editor copy before opening the imported proposal.
    if (draft && dirty) {
      try { localStorage.setItem(`${localKey(userId, draft)}:backup:${Date.now()}`, JSON.stringify(draft)); }
      catch { setError('No se pudo respaldar el borrador abierto. Conserva su texto antes de importar.'); return; }
    }
    setSelectedId(null); selectedRef.current = null; setEvents([]); setDraft(initial); setDirty(true); setError('');
    setNotice('Borrador recuperado para compartir. Revisa el contenido, asigna los roles y pulsa Guardar para el equipo. No se ha publicado automáticamente.');
    // importedDraft is a discrete user action; do not repeat it when the editor changes.
  }, [importedDraft, members, userId]);

  function canSwitch() {
    return !busy && (!dirty || globalThis.confirm('Tu borrador sin publicar se conserva en este navegador. ¿Abrir otra actividad?'));
  }
  function start(kind) {
    if (!canSwitch()) return;
    const initial = blankItem(kind, userId, members);
    const saved = readDraft(localKey(userId, initial));
    setSelectedId(null); selectedRef.current = null; setEvents([]); setDraft(saved || initial); setDirty(true); setError('');
    setNotice(saved ? 'Borrador local recuperado. Todavía no representa un acuerdo ni un aporte publicado.' : 'Prepara un incremento pequeño. Al guardarlo, los otros integrantes podrán leerlo y contrastarlo.');
    globalThis.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  function openItem(row) {
    if (!canSwitch()) return;
    const saved = readDraft(localKey(userId, row));
    setSelectedId(row.id); selectedRef.current = row.id; setEvents([]); setDraft(saved || editableItem(row)); setDirty(!!saved); setError('');
    setNotice(saved ? 'Se recuperó tu borrador local. Comprueba si el equipo guardó una versión posterior.' : 'Estás leyendo la versión compartida. Cualquier modificación genera una nueva versión y requiere otra revisión.');
  }
  function change(field, value) { setDraft(prior => ({ ...prior, [field]: value })); setDirty(true); }
  function changeContent(field, value) { setDraft(prior => ({ ...prior, content: { ...prior.content, [field]: value } })); setDirty(true); }

  async function save(event) {
    event.preventDefault();
    const invalid = validateItem(draft);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: failure } = await supabase.rpc('seminar_save_item', {
        p_item_id: draft.id, p_expected_revision: draft.revision, p_document: draft
      });
      if (failure) throw failure;
      if (!data?.id) throw new Error('No se recibió confirmación del guardado. Conserva el borrador y actualiza el espacio antes de repetir.');
      try { localStorage.removeItem(localKey(userId, draft)); } catch { /* Server confirmation is authoritative. */ }
      setItems(rows => [data, ...rows.filter(row => row.id !== data.id)]);
      setSelectedId(data.id); selectedRef.current = data.id; setDraft(editableItem(data)); setDirty(false);
      setNotice(`Versión ${data.revision} compartida. Guardar no equivale a revisar ni a alcanzar un acuerdo.`);
      await loadEvents(data.id);
    } catch (err) { setError(readableTeamError(err)); if (err?.code === '40001') await refresh(); }
    finally { setBusy(false); }
  }

  async function addEvent(event) {
    event.preventDefault();
    if (!item || dirty || remoteChanged) { setError('Antes de responder, guarda o compara el borrador y lee la versión vigente del equipo.'); return; }
    if (note.trim().length < 8) { setError('Explica qué contrastaste, qué propones o por qué estás de acuerdo.'); return; }
    if (action === 'review_approved' && !checks.every(Boolean)) { setError('Faltan las cuatro comprobaciones de revisión.'); return; }
    setBusy(true); setError('');
    try {
      const { error: failure } = await supabase.rpc('seminar_add_event', {
        p_item_id: item.id, p_revision: item.revision, p_type: action, p_note: note, p_checks: checks
      });
      if (failure) throw failure;
      setNote(''); setChecks([false, false, false, false]);
      setNotice('Tu intervención quedó registrada con tu cuenta y la versión que revisaste.');
      await loadEvents(item.id);
    } catch (err) { setError(readableTeamError(err)); if (err?.code === '40001') await refresh(); }
    finally { setBusy(false); }
  }

  function compareResolution(useServer) {
    if (!item || !draft) return;
    try { localStorage.setItem(`${localKey(userId, draft)}:before-merge:${Date.now()}`, JSON.stringify(draft)); }
    catch { setError('No fue posible respaldar las diferencias. Copia el texto antes de continuar.'); return; }
    if (useServer) {
      setDraft(editableItem(item)); setDirty(false);
      try { localStorage.removeItem(localKey(userId, draft)); } catch { /* The separate backup remains. */ }
      setNotice('Versión del equipo cargada. Tu borrador anterior permanece respaldado en este navegador.');
    } else {
      if (!globalThis.confirm('¿Ya comparaste e integraste las diferencias? Se conservará tu texto como propuesta sobre la última versión. Aún debes guardarlo para compartirlo.')) return;
      setDraft(prior => ({ ...prior, revision: item.revision })); setDirty(true);
      setNotice('Propuesta preparada sobre la última versión. Revisa el contenido y guarda para compartir la integración.');
    }
    setError('');
  }

  function exportRecord() {
    if (!item) return;
    const record = { exported_at: new Date().toISOString(), team_key: TEAM_KEY, members, item, events, note: 'Registro del simulador. No sustituye la versión oficial de Drive ni los acuerdos institucionales.' };
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `SEIA-equipo-${item.id}-v${item.revision}.json`; link.click();
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const visibleItems = filter === 'all' ? items : items.filter(row => row.kind === filter);
  const activity = draft ? TEAM_ACTIVITIES[draft.kind] : null;
  const reviewAllowed = canReview(item, userId) && !dirty && !remoteChanged;
  return <section className="seminar-team" aria-label="Espacio colaborativo del equipo XP">
    <header className="st-intro">
      <div><p className="st-kicker">RUTA DE SEMINARIO · EQUIPO XP</p><h1>Investigar es un trabajo compartido.</h1><p>Proponer, contrastar y reconstruir. Cada aporte conserva su versión, quién lo registró y qué revisó otra persona.</p></div>
      <button type="button" className="st-secondary" onClick={onOpenGuide}>Consultar la ruta y preparar un borrador →</button>
    </header>
    <div className="st-connection" role="status"><span>{connection}</span><button type="button" onClick={() => { setError(''); void refresh(); }}>Actualizar</button></div>
    {error && <div className="st-error" role="alert">{error}</div>}
    {notice && <div className="st-notice" role="status">{notice}</div>}
    {loading ? <p className="st-empty">Cargando el espacio compartido…</p> : !members.some(m => m.user_id === userId) ? <p className="st-empty">No se ha habilitado el espacio de este equipo para tu cuenta. La guía anterior permanece disponible y no se ha eliminado ningún borrador.</p> : <>
      <section className="st-members" aria-label="Integrantes del equipo">
        {members.map(member => <article key={member.user_id}><span className="st-initial">{member.display_name[0]}</span><div><strong>{member.display_name}</strong><small>{member.user_id === userId ? 'Tu cuenta · integrante del equipo' : 'Integrante del equipo'}</small></div></article>)}
      </section>
      <p className="st-principle">Roles rotativos por aporte: responsable y revisor son personas distintas. Todos pueden proponer e integrar cambios; nadie registra la revisión o el acuerdo en nombre de otra persona.</p>
      <section className="st-activities" aria-label="Actividades de investigación colaborativa">
        {Object.entries(TEAM_ACTIVITIES).map(([kind, info], index) => <button type="button" disabled={busy} key={kind} onClick={() => start(kind)}><span>0{index + 1}</span><strong>{info.label}</strong><small>Construir con el equipo →</small></button>)}
      </section>
      <div className="st-work-layout">
        <aside className="st-list"><h2>Aportes compartidos <span>{items.length}</span></h2>
          <label>Actividad<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Todas las actividades</option>{Object.entries(TEAM_ACTIVITIES).map(([kind, info]) => <option key={kind} value={kind}>{info.label}</option>)}</select></label>
          {!visibleItems.length && <p className="st-empty">Todavía no hay aportes compartidos en esta vista. Comiencen con una actividad o recuperen un borrador desde la guía.</p>}
          {visibleItems.map(row => <button type="button" disabled={busy} className={`st-item ${selectedId === row.id ? 'is-selected' : ''}`} key={row.id} onClick={() => openItem(row)} aria-pressed={selectedId === row.id}><small>{TEAM_ACTIVITIES[row.kind]?.label} · v{row.revision}</small><strong>{row.title}</strong><span>{row.stage_key || 'Etapa por precisar'}</span><small>Guardó: {name(row.updated_by)}<br/>{timestamp(row.updated_at)}</small></button>)}
        </aside>
        <div className="st-editor" ref={formRef}>
          {!draft ? <div className="st-welcome"><p className="st-kicker">DEL APORTE AL ACUERDO</p><h2>Un mismo recorrido, tres miradas.</h2><p>Elijan una actividad. Una persona desarrolla una propuesta, otra la contrasta y el equipo explicita sus decisiones. Los borradores individuales pueden preparar la conversación, pero no cuentan como un cierre colectivo.</p><p>La guía conserva la calendarización y las actividades anteriores. Trello mantiene el flujo de trabajo; Drive, el producto oficial y su historial. Este espacio reúne los aportes, el razonamiento y la revisión compartida.</p></div> : <>
            <form onSubmit={save}>
              <fieldset disabled={busy}>
                <div className="st-editor-heading"><div><p className="st-kicker">{activity.label}</p><h2>{draft.id ? `Trabajando sobre la versión ${draft.revision}` : 'Nueva propuesta para el equipo'}</h2></div><span className="st-state">{dirty ? 'Borrador sin publicar' : 'Versión compartida'}</span></div>
                <p className="st-purpose">{activity.purpose}</p>
                {draft.content.origin && <p className="st-local-note">{draft.content.origin}</p>}
                <label>Título del aporte<input required minLength={3} maxLength={180} value={draft.title} onChange={event => change('title', event.target.value)} placeholder="Una propuesta concreta que el equipo pueda revisar" /></label>
                <label>Etapa, evaluación o clave de trabajo<input maxLength={160} value={draft.stage_key} onChange={event => change('stage_key', event.target.value)} placeholder="Indiquen la etapa y la clave vigente, sin confundir evaluación y sprint" /></label>
                <div className="st-pair"><label>Responsable<select value={draft.owner_id} onChange={event => change('owner_id', event.target.value)}>{members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select></label><label>Revisor para Pair Research<select value={draft.reviewer_id} onChange={event => change('reviewer_id', event.target.value)}><option value="">Seleccionar otra persona</option>{members.map(m => <option disabled={m.user_id === draft.owner_id} key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select></label></div>
                {activity.fields.map(([field, label, help]) => <label key={field}>{label}<small>{help}</small><textarea rows={4} maxLength={20000} value={draft.content[field] || ''} onChange={event => changeContent(field, event.target.value)} /></label>)}
                <label>Enlace de evidencia o documento de trabajo<small>Enlace directo al documento o fuente. Su formato puede comprobarse; su contenido requiere revisión humana.</small><input type="url" maxLength={2000} value={draft.evidence_url} onChange={event => change('evidence_url', event.target.value)} placeholder="https://…" /></label>
                {remoteChanged && <section className="st-conflict"><h3>El equipo guardó una versión posterior</h3><p>Tu borrador no se sobrescribió. Compara e integra antes de guardar; una revisión anterior no valida una versión nueva.</p><div className="st-comparison"><details open><summary>Tu propuesta · base v{draft.revision}</summary><pre>{JSON.stringify(draft, null, 2)}</pre></details><details open><summary>Equipo · v{item.revision}</summary><pre>{JSON.stringify(editableItem(item), null, 2)}</pre></details></div><div className="st-actions"><button type="button" onClick={() => compareResolution(true)}>Cargar la versión del equipo</button><button type="button" onClick={() => compareResolution(false)}>Ya integré las diferencias</button></div></section>}
                <div className="st-actions"><button type="submit" className="st-primary" disabled={!dirty || remoteChanged}>{busy ? 'Guardando…' : 'Guardar para el equipo'}</button>{item && <button type="button" onClick={exportRecord}>Exportar registro compartido</button>}</div>
                <p className="st-footnote">Solo un guardado confirmado publica el aporte. No se copian automáticamente al equipo los borradores anteriores de cada navegador.</p>
              </fieldset>
            </form>
            {item && <section className="st-review"><p className="st-kicker">CONTRASTE Y REVISIÓN · V{item.revision}</p><h2>{eventLoading ? 'Cargando el registro de revisión…' : status.label}</h2><p>Responsable: <strong>{name(item.owner_id)}</strong><br/>Revisor: <strong>{name(item.reviewer_id)}</strong></p>
              {safeEvidenceUrl(item.evidence_url) && <a href={safeEvidenceUrl(item.evidence_url)} target="_blank" rel="noopener noreferrer">Abrir la evidencia para contrastarla ↗</a>}
              <div className="st-agreements"><h3>Posiciones del equipo · {status.agreementCount}/{members.length} acuerdos expresos</h3>{status.votes.map(({ member, event }) => <p key={member.user_id}><strong>{member.display_name}</strong><span>{event?.event_type === 'agree' ? 'Acuerdo confirmado' : event?.event_type === 'object' ? 'Objeción registrada' : 'Sin posición registrada en esta versión'}</span></p>)}<small>Una objeción queda visible. El silencio no es acuerdo; una nueva versión requiere nuevas confirmaciones.</small></div>
              <form onSubmit={addEvent}><fieldset disabled={busy || dirty || remoteChanged || eventLoading}>
                <label>Tu intervención<select value={action} onChange={event => { setAction(event.target.value); setChecks([false, false, false, false]); }}><option value="comment">Aportar una pregunta, evidencia o contraste</option><option value="review_approved" disabled={!reviewAllowed}>Registrar revisión en pares favorable</option><option value="review_changes" disabled={!reviewAllowed}>Solicitar ajustes como revisor</option><option value="agree">Confirmar mi acuerdo con esta versión</option><option value="object">Registrar una objeción fundamentada</option></select></label>
                {!reviewAllowed && <p className="st-footnote">Puedes comentar y expresar tu posición. La revisión formal corresponde al revisor asignado, distinto del responsable y de quien guardó esta versión.</p>}
                {action === 'review_approved' && <div className="st-checks">{REVIEW_CHECKS.map((text, index) => <label key={text}><input type="checkbox" checked={checks[index]} onChange={event => setChecks(values => values.map((value, n) => n === index ? event.target.checked : value))} /><span>{text}</span></label>)}</div>}
                <label>Fundamento de tu intervención<small>Explica qué verificaste, qué objeción encuentras o por qué mantienes o modificas tu posición. Una casilla no demuestra por sí sola la validez de una afirmación.</small><textarea required minLength={8} maxLength={6000} rows={4} value={note} onChange={event => setNote(event.target.value)} /></label>
                <button type="submit" className="st-primary">Registrar con mi cuenta</button>
              </fieldset></form>
              {(dirty || remoteChanged) && <p className="st-notice">Termina de guardar o comparar el borrador antes de responder a la versión compartida.</p>}
            </section>}
            {item && <section className="st-history"><h2>Historial y conversación</h2><p>Se muestran los últimos {Math.min(events.length, 30)} de {events.length} registros. La exportación incluye el historial cargado completo.</p>{events.slice(0, 30).map(entry => <article key={entry.id}><header><strong>{name(entry.actor_id)}</strong><small>v{entry.item_revision} · {timestamp(entry.created_at)}</small></header><p className="st-event-type">{EVENT_NAMES[entry.event_type]}</p><p>{entry.note}</p>{entry.event_type === 'revision' && <details><summary>Consultar el contenido de esta versión</summary><pre>{JSON.stringify(entry.payload.document, null, 2)}</pre></details>}</article>)}</section>}
          </>}
        </div>
      </div>
      <footer className="st-footer">XP adaptado al trabajo investigativo: incrementos pequeños, revisión en pares, responsabilidad compartida y mejora continua. La revisión académica y la aprobación docente no se sustituyen por este registro.</footer>
    </>}
  </section>;
}
