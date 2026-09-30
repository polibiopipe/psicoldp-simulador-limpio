import React, { useEffect, useState } from 'react';
import { FolderOpen, FileDown } from 'lucide-react';
import { LESSONS } from './learningContent.js';
import { driveFolder, driveFile } from './projectWorkspaceModel.js';

export function ProjectFiles({ project, onChange, onGenerate, lesson, open, onToggle, hasThesis, hasSection }) {
  const [folderInput, setFolderInput] = useState(project.folder || '');
  const [folderName, setFolderName] = useState(project.folderName || 'Mi tesis');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { setFolderInput(project.folder || ''); setFolderName(project.folderName || 'Mi tesis'); }, [project.folder, project.folderName]);
  function linkFolder() {
    const folder = driveFolder(folderInput);
    if (!folder) { setNotice('Pega el enlace de una carpeta de Google Drive: https://drive.google.com/drive/folders/…'); return; }
    onChange({ folder, folderName: folderName.trim() || 'Mi tesis' });
    setNotice('Carpeta vinculada por enlace. La subida de archivos se realiza manualmente en Drive.');
  }
  function saveFile() {
    const url = driveFile(fileUrl);
    if (!fileName.trim() || !url) { setNotice('Escribe el nombre y pega un enlace válido al archivo de Drive o Google Docs.'); return; }
    if (!editing && project.files.length >= 100) { setNotice('Hay 100 registros. Retira alguno que ya no necesites para añadir otro.'); return; }
    const previous = project.files.find(file => file.id === editing);
    const file = { ...previous, id: previous?.id || globalThis.crypto.randomUUID(), name: fileName.trim(), kind: previous?.kind || 'Enlace añadido', module: previous?.module ?? lesson.id, at: previous?.at || new Date().toISOString(), url };
    onChange({ files: previous ? project.files.map(row => row.id === previous.id ? file : row) : [file, ...project.files] });
    setFileName(''); setFileUrl(''); setEditing(null);
    setNotice('Enlace registrado. Comprueba en Drive que corresponde a la versión y carpeta que deseas conservar.');
  }
  const folder = driveFolder(project.folder);
  return <details className="pw-panel pw-files" open={open} onToggle={event => onToggle(event.currentTarget.open)}>
    <summary><FolderOpen aria-hidden="true"/> Mis archivos y carpeta de Drive <span>{folder ? project.folderName || 'Carpeta enlazada' : 'Vincula tu carpeta de investigación'}</span></summary>
    <p>Conserva tus documentos, versiones y respaldos en una carpeta propia. Los enlaces de este espacio se guardan con tu cuaderno.</p>
    <section className="pw-file-step"><p className="rl-eyebrow">1 · ELIGE DÓNDE CONSERVAR TU TRABAJO</p><h3>Mi carpeta de investigación</h3><div className="rl-pair"><label className="rl-field">Nombre de mi carpeta<input value={folderName} maxLength={100} onChange={event => setFolderName(event.target.value)}/></label><label className="rl-field">Enlace de mi carpeta en Drive<input type="url" value={folderInput} maxLength={2000} placeholder="https://drive.google.com/drive/folders/…" onChange={event => setFolderInput(event.target.value)}/></label></div><div className="rl-actions"><button type="button" onClick={linkFolder}>Vincular carpeta</button>{folder && <a href={folder} target="_blank" rel="noopener noreferrer">Abrir mi carpeta</a>}<a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noopener noreferrer">Ir a Drive para crear una carpeta</a></div><p className="rl-caption">En Drive, usa «Nuevo → Nueva carpeta» y copia su enlace. Puedes organizar subcarpetas de antecedentes, instrumentos, borradores y respaldos. Tú administras sus permisos desde Drive; el simulador no los modifica ni comprueba el acceso.</p></section>
    <section className="pw-file-step"><p className="rl-eyebrow">2 · CREA UNA COPIA DE TU TRABAJO</p><h3>Descargar y guardar en Drive</h3><p><strong>Descarga → abre tu carpeta → Nuevo → Subir archivo.</strong> La subida es manual: estos botones preparan la descarga y no envían archivos automáticamente a Google Drive.</p><div className="pw-export-grid">
      <button type="button" disabled={!hasThesis} onClick={() => onGenerate('thesis-docx')}><FileDown aria-hidden="true"/><span><strong>Mi tesis en Word</strong><small>Reúne tus apartados escritos y fuentes en un archivo .docx editable.</small></span></button>
      <button type="button" disabled={!hasSection} onClick={() => onGenerate('section-docx')}><FileDown aria-hidden="true"/><span><strong>Este apartado en Word</strong><small>{lesson.title}: conserva una versión para revisar.</small></span></button>
      <button type="button" onClick={() => onGenerate('notebook')}><FileDown aria-hidden="true"/><span><strong>Respaldo completo</strong><small>Archivo JSON recuperable: escritura, aprendizaje, tablero y enlaces.</small></span></button>
      <button type="button" disabled={!project.board.cards.length} onClick={() => onGenerate('board')}><FileDown aria-hidden="true"/><span><strong>Mi tablero en CSV</strong><small>Abre las tareas en una hoja de cálculo. El respaldo JSON conserva también su historial.</small></span></button>
    </div>{!hasThesis && <p className="rl-caption">La descarga de la tesis se habilita cuando escribes un apartado propio.</p>}{folder && <p><a href={folder} target="_blank" rel="noopener noreferrer">Abrir la carpeta para subir mi descarga</a></p>}</section>
    <section className="pw-file-step"><p className="rl-eyebrow">3 · DEJA UNA RUTA A TUS VERSIONES</p><h3>Registrar el enlace del archivo guardado</h3><p>Después de subir el archivo, copia su enlace desde Drive y asócialo aquí. Registrar un enlace no comprueba la subida, la carpeta ni los permisos.</p><div className="rl-pair"><label className="rl-field">Nombre del archivo o versión<input value={fileName} maxLength={180} onChange={event => setFileName(event.target.value)}/></label><label className="rl-field">Enlace al archivo en Drive<input type="url" value={fileUrl} maxLength={2000} onChange={event => setFileUrl(event.target.value)} placeholder="Enlace de un archivo de Drive o Google Docs"/></label></div><div className="rl-actions"><button type="button" onClick={saveFile}>{editing ? 'Guardar enlace de esta versión' : 'Registrar archivo'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setFileName(''); setFileUrl(''); }}>Cancelar asociación</button>}</div></section>
    {notice && <p role="status" className="rl-notice">{notice}</p>}
    <h3>Mis versiones y respaldos</h3>{!project.files.length && <p className="pw-empty">Los archivos que prepares para descargar y los enlaces que registres aparecerán aquí.</p>}<ul className="pw-file-list">{project.files.map(file => <li key={file.id}><div><strong>{file.name}</strong><small>{file.kind} · {file.at?.slice(0, 10) || 'Fecha sin registrar'}{file.module ? ' · ' + (LESSONS.find(row => row.id === file.module)?.title || '') : ''}</small><p>{driveFile(file.url) ? 'Enlace registrado por ti · verifica su acceso y versión en Drive' : 'Archivo preparado para descargar · enlace en Drive pendiente'}</p></div><div className="pw-file-actions">{driveFile(file.url) && <a href={driveFile(file.url)} target="_blank" rel="noopener noreferrer">Abrir archivo</a>}<button type="button" onClick={() => { setEditing(file.id); setFileName(file.name); setFileUrl(file.url || ''); setNotice('Completa el enlace en «Registrar el enlace del archivo guardado».'); }}>Asociar o cambiar enlace</button><button type="button" onClick={() => { if (globalThis.confirm('¿Retirar este registro del cuaderno? El archivo de Drive permanece intacto.')) { onChange({ files: project.files.filter(row => row.id !== file.id) }); if (editing === file.id) { setEditing(null); setFileName(''); setFileUrl(''); } } }}>Retirar registro</button></div></li>)}</ul>
  </details>;
}
