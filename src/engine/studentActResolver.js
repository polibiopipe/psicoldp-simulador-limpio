import { normalizeText } from "../utils/textUtils.js";

const ACT_PATTERNS = [
  {
    act: "saludo",
    confidence: 0.96,
    reason: "saludo",
    test: (text, words) =>
      /^(hola|buenas|buenos dias|buenas tardes|buenas noches)(\s|$)/.test(text)
      || /\b(soy estudiante de psicologia|gracias por estar aqui|gracias por venir|partir presentandome)\b/.test(text)
  },
  {
    act: "identidad_nombre",
    confidence: 0.98,
    reason: "nombre_identidad",
    test: (text) => /\b(como te llamas|cual es tu nombre|tu nombre|dime tu nombre|quien eres)\b/.test(text)
  },
  {
    act: "datos_basicos",
    confidence: 0.98,
    reason: "edad_datos_basicos",
    test: (text) => /\b(edad|cuantos anos|que edad tienes|anos tienes|en que trabajas|trabajas|a que te dedicas|ocupacion)\b/.test(text)
  },
  {
    act: "convivencia_familia",
    confidence: 0.95,
    reason: "convivencia_familia",
    test: (text) => /\b(con quien vives|quienes viven contigo|vives solo|vives con|donde vives|familia|hijos|pareja|con tus padres|con tu familia)\b/.test(text)
  },
  {
    act: "motivo_consulta",
    confidence: 0.97,
    reason: "motivo_consulta",
    test: (text) => /\b(por que estas aqui|que te trae|que te trajo|que te hizo venir|que te pasa|motivo|consulta|por que viniste|que haces aqui|por que decidiste venir|que te llevo a consultar|por que llegaste|por que consultaste|venir a esta conversacion|trae a esta conversacion|que hizo que vinieras|que hizo que consultaras)\b/.test(text)
  },
  {
    act: "emocion",
    confidence: 0.93,
    reason: "emocion_malestar",
    test: (text) => /\b(que sientes|que has sentido|has sentido|como te sientes|como te has sentido|como estas|como has estado|como lo has vivido|como lo viviste|como te afecta|que emociones|emociones aparecen|miedo|te da miedo|te preocupa|preocupacion|verguenza|triste|cansancio|cansado|desgaste|malestar|emocion|emociones|angustia|incomodidad)\b/.test(text)
  },
  {
    act: "experiencia_vivida",
    confidence: 0.91,
    reason: "seguimiento_experiencia",
    test: (text) => /\b(a que te refieres|que quieres decir|cuentame mas|explicame|explica|explicar|un poco mas|desde cuando|hace cuanto|cuando empezo|que paso|como lo vives|que significa|que hay detras|profundizar|de donde nace|que lo gatillo|que lo provoco|que hizo que|que hizo que esto|que lo hizo mas evidente|que volvio esto mas evidente|que lo volvio mas evidente|separacion|separaste|ex pareja|historia familiar|familia de origen|infancia)\b/.test(text)
  },
  {
    act: "rutina",
    confidence: 0.92,
    reason: "rutina",
    test: (text) => /\b(rutina|dia a dia|dia habitual|dia normal|dia comun|dia tipico|como es un dia|como es un dia normal|como es un dia para ti|como son tus dias|que haces durante el dia|piloto automatico|funcionando en automatico|automatico|cotidiano|cotidianidad)\b/.test(text)
  },
  {
    act: "apoyo_redes",
    confidence: 0.9,
    reason: "apoyo_redes",
    test: (text) => /\b(apoyo|red|amigos|amistades|con quien hablas|personas cercanas|quien te ayuda|recursos|acompanas|acompanan)\b/.test(text)
  },
  {
    act: "agenda_proxima_sesion",
    confidence: 0.96,
    reason: "agenda_continuidad",
    test: (text) => /\b(agendar|agendamos|proxima sesion|puedes venir|podrias venir|te parece si vienes|vienes en|te espero|nos vemos el|nos vemos en|a las \d{1,2}|hrs|hora|lunes|martes|miercoles|jueves|viernes|sabado|domingo|\d+\s*(dias|semanas) mas)\b/.test(text)
  },
  {
    act: "cierre",
    confidence: 0.94,
    reason: "cierre",
    test: (text) => /\b(cerrar|terminar|dejamos hasta aqui|dejemos hasta aqui|nos vemos|hasta la proxima|para cerrar|para finalizar|gracias por venir|terminamos por hoy|queda poco tiempo)\b/.test(text)
  },
  {
    act: "pregunta_confusa",
    confidence: 0.42,
    reason: "pregunta_confusa",
    test: (text, words) =>
      words.length <= 2
      && /\b(eso|y|como|que|por que|explica|mmm|aja)\b/.test(text)
  },
  {
    act: "intervencion_confrontativa",
    confidence: 0.9,
    reason: "confrontativa_directiva",
    test: (text) => /\b(tienes que|deberias|solo tienes|no es para tanto|estas exagerando|eso esta mal|decide de una vez|lo mejor es|te recomiendo|hazlo nomas|no deberia costarte)\b/.test(text)
  },
  {
    act: "intervencion_empatica",
    confidence: 0.88,
    reason: "empatia_validacion",
    test: (text) => /\b(entiendo|comprendo|tiene sentido|gracias por contarlo|no te juzgo|sin juzgar|a tu ritmo|con calma|no tienes que resolver|te escucho|debe ser dificil|me imagino)\b/.test(text)
  }
];

export function resolveStudentAct({ studentMessage = "", memory = {} } = {}) {
  const normalizedMessage = normalizeText(studentMessage);
  const words = normalizedMessage.split(/\s+/).filter(Boolean);
  const taskDetails = detectTaskDetails(normalizedMessage, studentMessage);
  const hasTaskContext = Boolean(memory.taskAssigned || memory.taskAccepted || memory.currentTopic === "tarea");

  if (!normalizedMessage) {
    return buildResult("pregunta_confusa", normalizedMessage, 0.3, ["mensaje_vacio"], null);
  }

  if (isAgendaMessage(normalizedMessage)) {
    return buildResult("agenda_proxima_sesion", normalizedMessage, 0.97, ["agenda_continuidad"], null);
  }

  if (/\b(funcionando en automatico|piloto automatico|automatico)\b/.test(normalizedMessage)) {
    return buildResult("rutina", normalizedMessage, 0.95, ["rutina_automatico"], null);
  }

  if (hasTaskContext && /\b(tarea|registro|lo hiciste|la hiciste|pudiste hacerlo|como te fue|que observaste|que notaste|anotaste)\b/.test(normalizedMessage)) {
    return buildResult("seguimiento_tarea", normalizedMessage, 0.95, ["seguimiento_tarea"], memory.taskDetails || null);
  }

  if (taskDetails) {
    return buildResult("tarea_terapeutica", normalizedMessage, 0.98, ["tarea_propuesta"], taskDetails);
  }

  if (hasTaskContext && /\b(te parece|te parece bien|estas de acuerdo|lo podrias hacer|podrias hacerlo|puedes hacerlo|te sirve|esta bien asi)\b/.test(normalizedMessage)) {
    return buildResult("confirmar_tarea", normalizedMessage, 0.96, ["confirmacion_tarea"], memory.taskDetails || null);
  }

  for (const pattern of ACT_PATTERNS) {
    if (pattern.test(normalizedMessage, words)) {
      return buildResult(pattern.act, normalizedMessage, pattern.confidence, [pattern.reason], null);
    }
  }

  return buildResult("pregunta_confusa", normalizedMessage, 0.35, ["sin_match_claro"], null);
}

function detectTaskDetails(normalizedMessage, originalMessage) {
  const proposesTask = /\b(te propongo|como tarea|tarea|podrias|al final del dia|al finalizar tu dia|durante la semana|escribir|anotar|registrar|llevar registro|registro)\b/.test(normalizedMessage);
  if (!proposesTask) return null;

  const isDailyReflection = /\b(al final del dia|al finalizar tu dia|durante el dia|que paso|que te afecto|positiva|negativamente|emociones|situaciones)\b/.test(normalizedMessage);

  return {
    type: isDailyReflection ? "registro_diario_situaciones_emociones" : "tarea_concreta",
    description: isDailyReflection
      ? "Escribir al final del dia que ocurrio y que le afecto positiva o negativamente."
      : "Realizar una tarea concreta propuesta por el estudiante.",
    proposedText: String(originalMessage || "").trim()
  };
}

function isAgendaMessage(normalizedMessage) {
  return /\b(agendar|agendamos|proxima sesion|proxima semana|puedes venir|podrias venir|te parece si vienes|vienes en|te espero|nos vemos|nos vemos el|nos vemos en|revisar como te fue|a las \d{1,2}|hrs|hora|lunes|martes|miercoles|jueves|viernes|sabado|domingo|\d+\s*(dias|semanas) mas)\b/.test(normalizedMessage);
}

function buildResult(detectedAct, normalizedMessage, confidence, reasons, taskDetails) {
  return {
    detectedAct,
    normalizedMessage,
    confidence,
    reasons,
    taskDetails
  };
}
