import { LESSONS, isLessonReviewed } from './learningContent.js';

export const JOURNEY_STAGES = [
  { id:'orientar', title:'Orientar', question:'¿Qué quiero conocer y cómo nos organizamos?', product:'Tema, delimitación y acuerdo de trabajo.', ids:['tema','delimitacion','xp'], bridge:'La delimitación orienta qué evidencia buscar; XP organiza cómo la revisamos.' },
  { id:'buscar', title:'Buscar evidencia', question:'¿Qué necesito leer y cómo lo encontraré?', product:'Búsqueda trazable y antecedentes comparados.', ids:['busqueda','booleanas','pico','flujo','antecedentes'], bridge:'Los antecedentes alimentan el argumento; un conteo de resultados no demuestra un vacío.' },
  { id:'argumentar', title:'Construir el argumento', question:'¿Qué sabemos y qué falta comprender?', product:'Lente, embudo, contraste y problema.', ids:['concepto','embudo','negativo','positivo','vacio'], bridge:'El problema debe explicar por qué surge la pregunta que formularás.' },
  { id:'formular', title:'Formular', question:'¿Qué conocimiento se compromete a producir el estudio?', product:'Pregunta y objetivos coherentes.', ids:['pregunta','objetivos'], bridge:'La pregunta orienta el método. Elegir primero una técnica puede desviar el foco.' },
  { id:'disenar', title:'Diseñar', question:'¿Qué evidencia permitirá responder y con qué cuidados?', product:'Diseño, participantes, instrumentos, ética y análisis.', ids:['diseno','cuantitativo','cualitativo','mixto','muestra','instrumentos','etica','analisis'], bridge:'Compara alternativas y declara lo pendiente antes de recoger información.' },
  { id:'revisar', title:'Revisar con el equipo', question:'¿Qué cambia después de contrastar nuestra versión?', product:'Incremento revisado, decisiones y próximos ajustes.', ids:['iteracion','pares'], bridge:'Vuelve a los apartados afectados. Esta revisión también puede hacerse en cualquier etapa.' },
  { id:'comunicar', title:'Comunicar', question:'¿Qué podemos sostener y dentro de qué límites?', product:'Resultados o plan, discusión, referencias y defensa.', ids:['resultados','discusion','referencias','defensa'], bridge:'Las conclusiones responden la pregunta con evidencia; si todavía no hay datos, formula un plan.' }
];
export const SUPPORT_LEVELS = [
  ['guided','Con guía paso a paso','Ver un ejemplo y usar pistas antes del desarrollo propio.'],
  ['hints','Con pistas a elección','Intentar primero y abrir la ayuda que necesites.'],
  ['independent','Con menos ayuda','Resolver primero; los apoyos siguen disponibles.']
];
export const METHOD_CHOICES = [
  ['undecided','Todavía estoy explorando'],['cuantitativo','Ruta cuantitativa provisional'],['cualitativo','Ruta cualitativa provisional'],['mixto','Ruta mixta provisional']
];
const hasText = value => typeof value === 'string' && !!value.trim();
export function stageFor(id) { return JOURNEY_STAGES.find(stage => stage.ids.includes(id)) || JOURNEY_STAGES[0]; }
export function routeIds(guide = {}) {
  const branches = ['cuantitativo','cualitativo','mixto'];
  const chosen = guide.route;
  return JOURNEY_STAGES.flatMap(stage => stage.ids).filter(id => !branches.includes(id) || id === chosen || (chosen === 'mixto' && branches.includes(id)));
}
export function nextJourneyModule(id,guide) {
  const all=JOURNEY_STAGES.flatMap(stage=>stage.ids), selected=new Set(routeIds(guide));
  return all.slice(all.indexOf(id)+1).find(id=>selected.has(id));
}
export function recordState(lesson, record = {}) {
  if (isLessonReviewed(record)) return 'Revisión vigente';
  if (record.review) return 'Revisar cambios';
  if (hasText(record.practice) || Object.values(record.fields || {}).some(hasText)) return 'En desarrollo';
  return 'Por explorar';
}
export function suggestedAction(notebook = {}) {
  const records = notebook.records || {};
  const ids = routeIds(notebook.guide);
  const id = ids.find(id => !isLessonReviewed(records[id]));
  if (!id) return { id:'defensa', step:5, title:'Revisar el proyecto integrado', why:'La ruta reúne revisiones personales vigentes. Contrasta el argumento completo con el equipo; esto no acredita su validez científica.' };
  if (stageFor(id).id === 'disenar' && id !== 'diseno' && (!notebook.guide?.route || notebook.guide.route === 'undecided')) return {id:'diseno',step:0,title:'Comparar y fundamentar el enfoque',why:'La ruta metodológica sigue abierta. Compara lo que cada enfoque permite conocer y registra por qué mantienes o pospones una elección. Puedes explorar los demás módulos.'};
  const lesson = LESSONS.find(row => row.id === id), record = records[id] || {};
  if (record.review) return {id,step:5,title:'Revisar la versión de «' + lesson.title + '»',why:'Cambió un desarrollo que tenía revisión registrada. Comprueba qué apartados afecta antes de actualizar el cierre.'};
  if (lesson.fields.every(f => hasText(record.fields?.[f.key])) && hasText(record.practice)) return {id,step:4,title:'Contrastar «' + lesson.title + '»',why:'Ya hay una práctica y campos desarrollados. Revisa sus razones, respaldo y conexiones antes de registrar coherencia.'};
  if (hasText(record.practice)) return {id,step:3,title:'Aplicar «' + lesson.title + '»',why:'Tienes un intento de práctica. Ahora formula el apartado de tu investigación con fuentes propias.'};
  return {id,step:notebook.guide?.support === 'independent' || notebook.guide?.support === 'hints' ? 2 : 0,title:'Trabajar «' + lesson.title + '»',why:'Es el primer módulo sin revisión vigente en la ruta sugerida. Puedes comenzar aquí o elegir otro apartado según tu necesidad.'};
}
export function moduleConnections(id, records = {}) {
  const prerequisites = {
    busqueda:['delimitacion'], booleanas:['busqueda'], pico:['pregunta'], flujo:['busqueda','booleanas'], antecedentes:['busqueda'], concepto:['antecedentes'], embudo:['delimitacion','antecedentes'], negativo:['antecedentes'], positivo:['concepto','antecedentes'], vacio:['negativo','positivo'], pregunta:['vacio','delimitacion'], objetivos:['pregunta'], diseno:['pregunta','objetivos'], cuantitativo:['diseno'], cualitativo:['diseno'], mixto:['diseno'], muestra:['delimitacion','diseno'], instrumentos:['concepto','objetivos'], etica:['diseno'], analisis:['objetivos','instrumentos'], iteracion:['xp'], pares:['iteracion'], resultados:['analisis'], discusion:['resultados','antecedentes'], referencias:['antecedentes'], defensa:['pregunta','objetivos','diseno']
  };
  return (prerequisites[id] || []).map(key => ({...LESSONS.find(row => row.id === key),hasDraft:Object.values(records[key]?.fields || {}).some(hasText)}));
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00');
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}
export function dueReviews(records = {}, today = localDate()) {
  return LESSONS.filter(row => validDate(records[row.id]?.learning?.due) && records[row.id].learning.due <= today).map(row => ({...row,due:records[row.id].learning.due}));
}
export function cleanGuide(value = {}) {
  return {route:METHOD_CHOICES.some(([id]) => id === value?.route) ? value.route : 'undecided', support:SUPPORT_LEVELS.some(([id]) => id === value?.support) ? value.support : 'guided',reason:String(value?.reason || '').slice(0,4000),alternative:String(value?.alternative || '').slice(0,4000),decisions:Array.isArray(value?.decisions) ? value.decisions.slice(0,40).filter(row=>row && METHOD_CHOICES.some(([id])=>id===row.route) && Number.isFinite(Date.parse(row.at))).map(row=>({route:row.route,reason:String(row.reason || '').slice(0,4000),alternative:String(row.alternative || '').slice(0,4000),at:new Date(row.at).toISOString()})) : []};
}
export function cleanLearning(value) {
  if (!value || typeof value !== 'object') return undefined;
  const result = {};
  for (const key of ['goal','reason','alternative','difficulty','recall','recallReflection','transfer','transferReason']) result[key] = String(value[key] || '').slice(0,4000);
  result.due = validDate(value.due) ? value.due : '';
  result.attempts = Array.isArray(value.attempts) ? value.attempts.slice(0,40).map(row => ({at:String(row?.at || '').slice(0,40),answer:String(row?.answer || '').slice(0,4000),reason:String(row?.reason || '').slice(0,4000),alternative:String(row?.alternative || '').slice(0,4000),support:SUPPORT_LEVELS.some(([id]) => id === row?.support) ? row.support : 'guided',help:row?.help === true})) : [];
  if (value.beforeHelp && typeof value.beforeHelp === 'object') result.beforeHelp = {answer:String(value.beforeHelp.answer || '').slice(0,4000),reason:String(value.beforeHelp.reason || '').slice(0,4000)};
  return result;
}

export const TRANSFER_CASES = {
  orientar:{prompt:'Una compañera quiere demostrar que una aplicación sirve para todas las personas. Reformula su intención de conocimiento, delimita participantes y explica qué resultado podría hacerla revisar su idea.',hint:'Distingue interés personal, pregunta abierta y conclusión anticipada.'},
  buscar:{prompt:'Una búsqueda entrega dos resultados y otra entrega doscientos. El equipo quiere declarar un vacío con la primera. ¿Qué revisarías en términos, fuentes y selección antes de decidir?',hint:'El número de coincidencias no equivale al estado del conocimiento. Pide la cadena exacta y compara cobertura y pertinencia.'},
  argumentar:{prompt:'Un artículo cercano estudia satisfacción y otro examina cómo se justifican decisiones. ¿Qué función tendría cada uno en tu argumento y qué vacío todavía necesitaría respaldo?',hint:'Compara pregunta, constructo y evidencia. Un resultado favorable no convierte un antecedente en estado del arte positivo.'},
  formular:{prompt:'El objetivo general busca comprender experiencias, pero los específicos prometen demostrar un efecto universal. Propón una corrección y justifica qué compromiso de conocimiento mantienes.',hint:'Alinea los verbos, el alcance y el tipo de evidencia. No conviertas técnicas en objetivos.'},
  disenar:{prompt:'Caso ficticio: cuatro voluntarios usan una actividad. Sus puntuaciones son 2, 3, 3 y 4 en una rúbrica aún sin justificar; tres declaran satisfacción. Decide qué puedes describir, qué evidencia falta y si esto permite atribuir un efecto a la actividad.',hint:'Separa medición, percepción, selección y causalidad. La simulación de datos permite practicar; no crea hallazgos para tu tesis.'},
  revisar:{prompt:'El revisor pide retirar una afirmación central y otro integrante quiere mantenerla por falta de tiempo. Propón un incremento pequeño que permita decidir con evidencia y explica cómo conservarías la objeción.',hint:'Acuerda producto, responsable, revisor, fuente y criterio. Silencio y consenso no equivalen a validación científica.'},
  comunicar:{prompt:'El estudio no encontró el patrón esperado. El equipo propone omitirlo del informe. Redacta una conclusión prudente y explica cómo dialogaría con los antecedentes.',hint:'Un resultado nulo o discrepante puede ser informativo. Respeta objetivos, diseño, incertidumbre y límites del corpus.'}
};

// A deliberately tiny fictional index for reasoning about set operations only.
export const TRAINING_DOCUMENTS = [
  {id:'A',title:'Estrés en estudiantes',terms:['estrés','estudiantes']},
  {id:'B',title:'Stress en estudiantes',terms:['stress','estudiantes']},
  {id:'C',title:'Estrés en trabajadores',terms:['estrés','trabajadores']},
  {id:'D',title:'Sueño en estudiantes',terms:['sueño','estudiantes']},
  {id:'E',title:'Estrés y stress: términos en estudiantes',terms:['estrés','stress','estudiantes']},
  {id:'F',title:'Stress en trabajadores',terms:['stress','trabajadores']}
];
export function simulateBoolean(inner = 'OR', outer = 'AND', grouping = 'left') {
  const combine = (a,b,operator) => operator === 'AND' ? a && b : a || b;
  const query = grouping === 'left' ? `(estrés ${inner} stress) ${outer} estudiantes` : `estrés ${inner} (stress ${outer} estudiantes)`;
  return {query,matches:TRAINING_DOCUMENTS.filter(row => {
    const a=row.terms.includes('estrés'),b=row.terms.includes('stress'),c=row.terms.includes('estudiantes');
    return grouping === 'left' ? combine(combine(a,b,inner),c,outer) : combine(a,combine(b,c,outer),inner);
  }).map(row=>row.id)};
}
