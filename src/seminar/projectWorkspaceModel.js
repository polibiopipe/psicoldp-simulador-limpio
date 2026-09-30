import { LESSONS } from './learningContent.js';
import { validDate } from './learningJourney.js';
export const KANBAN_COLUMNS = [['todo','Por hacer'],['doing','En curso'],['review','En revisión'],['done','Terminado']];
const str=(value,max=2000)=>typeof value==='string' ? value.slice(0,max) : '';
const iso=value=>typeof value==='string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '';
export function safeLink(value) {
  try {const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password ? url.href : '';} catch {return '';}
}
export function driveFolder(value) {
  try {const url=new URL(String(value).trim());if(url.protocol!=='https:' || url.hostname!=='drive.google.com' || url.username || url.password)return '';
    const match=url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([\w-]+)\/?$/);if(!match)return '';
    const key=url.searchParams.get('resourcekey');return 'https://drive.google.com/drive/folders/'+match[1]+(key ? '?resourcekey='+encodeURIComponent(key) : '');
  } catch {return '';}
}
export function driveFile(value) {
  try {const url=new URL(safeLink(value));if(!['drive.google.com','docs.google.com'].includes(url.hostname))return '';
    return /\/d\/[\w-]+/.test(url.pathname) || (url.hostname==='drive.google.com' && url.pathname==='/open' && /^[\w-]+$/.test(url.searchParams.get('id') || '')) ? url.href : '';
  } catch {return '';}
}
export function cleanProject(value={}) {
  const board=value?.board || {},seen=new Set();
  const cards=(Array.isArray(board.cards) ? board.cards : []).slice(0,80).filter(row=>row&&typeof row==='object').map((row,n)=>{
    let id=str(row.id,100) || 'import-card-'+n;while(seen.has(id))id='import-'+n+'-'+id;seen.add(id);
    return {id,title:str(row.title,180),module:LESSONS.some(l=>l.id===row.module) ? row.module : 'tema',status:KANBAN_COLUMNS.some(([id])=>id===row.status) ? row.status : 'todo',owner:str(row.owner,120),reviewer:str(row.reviewer,120),due:validDate(row.due) ? row.due : '',product:str(row.product),evidence:safeLink(row.evidence),blocked:row.blocked===true,blockReason:str(row.blockReason),reviewNote:str(row.reviewNote),checks:(Array.isArray(row.checks) ? row.checks : []).slice(0,12).filter(c=>c&&typeof c==='object').map(c=>({text:str(c.text,400),done:c.done===true})).filter(c=>c.text.trim()),createdAt:iso(row.createdAt),startedAt:iso(row.startedAt),finishedAt:iso(row.finishedAt),history:(Array.isArray(row.history) ? row.history : []).slice(-40).map(h=>({at:iso(h?.at),from:str(h?.from,20),to:str(h?.to,20)}))};
  });
  const files=(Array.isArray(value?.files) ? value.files : []).slice(0,100).filter(f=>f&&typeof f==='object').map((f,n)=>({id:'file-'+n+'-'+str(f.id,60),name:str(f.name,180),kind:str(f.kind,40),module:LESSONS.some(l=>l.id===f.module) ? f.module : '',at:iso(f.at),url:driveFile(f.url),note:str(f.note,500)}));
  return {folder:driveFolder(value?.folder),folderName:str(value?.folderName,100),files,board:{wipLimit:Number.isInteger(board.wipLimit)&&board.wipLimit>=1&&board.wipLimit<=12 ? board.wipLimit : 3,cards}};
}
export function activeWork(cards=[]) {return cards.filter(c=>['doing','review'].includes(c.status));}
export function transitionCard(board,id,status,now=new Date().toISOString()) {
  const card=board.cards.find(c=>c.id===id);
  if(!card || !KANBAN_COLUMNS.some(([key])=>key===status))return {error:'No se encontró la tarjeta o el estado.'};
  if(card.status===status)return {board};
  if(['doing','review'].includes(status)&&!['doing','review'].includes(card.status)&&activeWork(board.cards).length>=board.wipLimit)return {error:'Llegaste al límite de trabajo en curso. Termina o devuelve una tarea a Por hacer antes de iniciar otra, o revisa el límite acordado.'};
  if(status==='review'&&!card.product.trim())return {error:'Describe el producto que se revisará antes de pasar a En revisión.'};
  if(status==='done'&&(card.blocked||!card.product.trim()||!card.checks.length||card.checks.some(c=>!c.done)||!card.reviewNote.trim()))return {error:'Para terminar: resuelve el bloqueo, describe el producto, comprueba todos los criterios y registra la revisión de cierre.'};
  const updated={...card,status,startedAt:status==='todo' ? '' : card.startedAt||now,finishedAt:status==='done' ? now : '',history:[...(card.history||[]),{at:now,from:card.status,to:status}].slice(-40)};
  return {board:{...board,cards:board.cards.map(c=>c.id===id ? updated : c)}};
}
export function csvCell(value) {let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function boardCsv(board) {
  return '\ufeff'+[['Tarea','Estado','Apartado','Responsable','Revisor','Fecha','Producto','Evidencia','Bloqueo','Revisión de cierre'],...(board.cards||[]).map(c=>[c.title,KANBAN_COLUMNS.find(([id])=>id===c.status)?.[1],LESSONS.find(l=>l.id===c.module)?.title,c.owner,c.reviewer,c.due,c.product,c.evidence,c.blocked ? c.blockReason||'Bloqueada' : '',c.reviewNote])].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
