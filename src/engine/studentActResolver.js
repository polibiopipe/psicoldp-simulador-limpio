import { normalizeText } from "../utils/textUtils.js";

const ACT_PATTERNS = [
  {
    act: "saludo",
    confidence: 0.96,
    reason: "saludo",
    test: (text, words) =>
      /^(hola|buenas|buenos dias|buenas tardes|buenas noches)(\s|$)/.test(text)
      || /\b(soy estudiante de psicologia|partir presentandome)\b/.test(text)
  },
  {
    act: "apertura_vinculo",
    confidence: 0.95,
    reason: "apertura_vinculo",
    test: (text) => /\b(me gustaria conocerte|quisiera conocerte|me gustaria saber mas de ti|saber mas de ti|quiero conocerte un poco|te parece si te conozco un poco|te parece bien si conversamos|te parece bien si partimos conociendote|podemos conocernos un poco|podemos partir conociendote|cuentame un poco de ti|me gustaria que me contaras de ti|antes de seguir me gustaria conocerte|me gustaria saber mas de tu historia|quiero conocer un poco tu historia|me gustaria saber quien eres mas alla del problema|te parece bien|te parece|gracias por estar aqui|gracias por venir|podemos ir con calma|quiero escucharte|me interesa entenderte|no tienes que contar todo de inmediato|podemos partir de a poco|puedes contarme lo que te haga sentido|me gustaria entender que estas viviendo|quiero entender que estas viviendo)\b/.test(text)
  },
  {
    act: "identidad_nombre",
    confidence: 0.98,
    reason: "nombre_identidad",
    test: (text) => /\b(como te llamas|cual es tu nombre|tu nombre|dime tu nombre|quien eres)\b/.test(text)
  },
  {
    act: "encuadre_confidencialidad",
    confidence: 0.98,
    reason: "encuadre_confidencialidad",
    test: (text) => /\b(todo lo que conversemos|todo lo que conversemos quedara|conversaciones seran privadas|nuestras conversaciones|lo que me digas quedara|conversacion quedara aqui|quedara entre nosotros|quedara aqui|queda resguardado|resguardare|resguardar|confidencialidad|confidencial|conversacion privada|privada|salvo que estes en riesgo|salvo que estes en peligro|situacion de riesgo|ponga en riesgo|te ponga en riesgo|estas de acuerdo)\b/.test(text)
  },
  {
    act: "edad",
    confidence: 0.98,
    reason: "edad",
    test: (text) => /\b(edad|cuantos anos|que edad tienes|anos tienes|tu edad|que edad)\b/.test(text)
  },
  {
    act: "vivienda",
    confidence: 0.97,
    reason: "vivienda",
    test: (text) => /\b(con quien vives|quienes viven contigo|vives solo|vives sola|vives con|donde vives|donde estas viviendo|donde resides|en que comuna vives|en que ciudad vives|con quien estas viviendo|con quienes vives|con quienes vives)\b/.test(text)
  },
  {
    act: "familia_composicion",
    confidence: 0.96,
    reason: "familia_composicion",
    test: (text) => /\b(como se compone tu familia|quienes componen tu familia|quienes forman tu familia|quienes son parte de tu familia|quienes son tu familia|como es tu familia|familia cercana|tienes hermanos|tienes hermana|tienes hermano|hermanos|hermana|hermano|tu mama|tu papa|madre|padre|hijos|hija|hijo)\b/.test(text)
  },
  {
    act: "estado_civil_pareja",
    confidence: 0.96,
    reason: "estado_civil_pareja",
    test: (text) => /\b(eres casado|eres casada|estas casado|estas casada|tienes pareja|estas en pareja|tienes esposa|tienes esposo|tienes polola|tienes pololo|tienes novia|tienes novio|estado civil|vives con tu pareja|relacion de pareja)\b/.test(text)
  },
  {
    act: "ocupacion_estudios",
    confidence: 0.97,
    reason: "ocupacion_estudios",
    test: (text) => /\b(a que te dedicas|en que trabajas|trabajas|trabajo|ocupacion|que haces laboralmente|estudias|estudios|universidad|colegio|escuela|vas al colegio|vas a la escuela|que estudias|donde estudias|curso)\b/.test(text)
  },
  {
    act: "motivo_consulta",
    confidence: 0.97,
    reason: "motivo_consulta",
    test: (text) => /\b(por que estas aqui|por que estas aca|que te trae|que te trajo|que te hizo venir|que te pasa|motivo|consulta|por que viniste|que haces aqui|que haces aca|por que decidiste venir|que te llevo a consultar|por que llegaste|por que consultaste|venir a esta conversacion|trae a esta conversacion|que hizo que vinieras|que hizo que consultaras|por que vienes|por que estas conversando)\b/.test(text)
  },
  {
    act: "red_apoyo",
    confidence: 0.94,
    reason: "red_apoyo",
    test: (text) => /\b(red de apoyo|apoyo|con quien cuentas|con quien hablas|a quien recurres|quien te ayuda|quienes te apoyan|personas cercanas|amigos|amistades|familia te apoya|recursos)\b/.test(text)
  },
  {
    act: "riesgo_autolesion",
    confidence: 0.99,
    reason: "riesgo_autolesion",
    test: (text) => /\b(hacerte dano|hacerte daNo|hacerte mal|hacer dano|has pensado en hacerte|quitarte la vida|suicid|morirte|no querer vivir|autolesion|autolesiones|lastimarte|danarte|danarte)\b/.test(text)
  },
  {
    act: "consumo_sustancias",
    confidence: 0.97,
    reason: "consumo_sustancias",
    test: (text) => /\b(consumes|consumo|alcohol|drogas|sustancias|marihuana|cannabis|pastillas|medicamentos sin receta|tomar de mas|otras sustancias)\b/.test(text)
  },
  {
    act: "sintomas_malestar",
    confidence: 0.93,
    reason: "sintomas_malestar",
    test: (text) => /\b(que sientes|que has sentido|has sentido|como te sientes|como te has sentido|como estas|como has estado|como lo has vivido|como lo viviste|como te afecta|que emociones|emociones aparecen|miedo|te da miedo|te preocupa|preocupacion|verguenza|triste|tristeza|cansancio|cansado|cansada|desgaste|malestar|emocion|emociones|angustia|ansiedad|incomodidad|sintomas|que te pasa emocionalmente)\b/.test(text)
  },
  {
    act: "experiencia_vivida",
    confidence: 0.91,
    reason: "seguimiento_experiencia",
    test: (text) => /\b(a que te refieres|que quieres decir|cuentame mas|explicame|explica|explicar|un poco mas|desde cuando|hace cuanto|cuando empezo|que paso|como lo vives|que significa|que hay detras|que lugar tiene|que lugar ocupa|que significa para ti|profundizar|de donde nace|que lo gatillo|que lo provoco|que hizo que|que hizo que esto|que lo hizo mas evidente|que volvio esto mas evidente|que lo volvio mas evidente|computador|videojuego|videojuegos|jugar|juego online|amistades online|mundo online|separacion|separaste|ex pareja|historia familiar|familia de origen|infancia)\b/.test(text)
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
    act: "cierre_sesion",
    confidence: 0.94,
    reason: "cierre_sesion",
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

  if (isMotiveQuestion(normalizedMessage)) {
    return buildResult("motivo_consulta", normalizedMessage, 0.98, ["motivo_consulta_prioritario"], null);
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

function isMotiveQuestion(normalizedMessage) {
  return /\b(por que estas aqui|por que estas aca|que te trae|que te trajo|que te hizo venir|motivo de consulta|por que viniste|que haces aqui|que haces aca|por que decidiste venir|que te llevo a consultar|por que llegaste|por que consultaste|que hizo que vinieras|que hizo que consultaras|por que vienes)\b/.test(normalizedMessage);
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
