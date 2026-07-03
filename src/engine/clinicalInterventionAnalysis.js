import { analyzeTherapeuticApproaches } from "./therapeuticApproachAnalyzer.js";
import { normalizeText } from "../utils/textUtils.js";

const APPROACH_ALIASES = {
  cognitivo: "cognitivo_conductual",
  conductual: "cognitivo_conductual",
  cognitivo_conductual: "cognitivo_conductual",
  humanista: "humanista",
  psicoanalitico_psicodinamico: "psicodinamico",
  sistemico: "sistemico",
  tercera_generacion: "tercera_generacion",
  narrativo: "narrativo",
  existencial: "existencial"
};

export function analyzeClinicalIntervention({
  studentMessage,
  intentResult,
  selectedInterventionType = "",
  sessionNumber = 1,
  previousSessionSummary = null,
  memory = null
}) {
  const text = normalizeText(studentMessage);
  const practicalAct = detectPracticalAct({
    text,
    memory
  });
  const topic = practicalAct?.topic || detectClinicalTopic({
      text,
      intent: intentResult?.intent,
      selectedInterventionType
    });
  const taskKind = detectTaskKind({
    text,
    sessionNumber,
    hasPreviousTask: Boolean(previousSessionSummary?.tareaAcordada || memory?.taskAssigned),
    practicalAct
  });
  const poorType = detectPoorIntervention(text, studentMessage);
  const goodType = detectGoodIntervention({ text, intent: intentResult?.intent });
  const approach = detectClinicalApproach(studentMessage);

  return {
    normalizedMessage: text,
    topic,
    taskKind,
    poorType,
    goodType,
    approach,
    practicalAct: practicalAct?.type || null,
    taskDetails: practicalAct?.type === "task_proposal"
      ? describeTask(text, studentMessage)
      : memory?.taskDescription
        ? {
            type: memory.taskType,
            description: memory.taskDescription,
            proposedText: memory.taskProposedText || null
          }
        : null,
    isClosure: !practicalAct && (intentResult?.intent === "cierre" || topic === "cierre"),
    isExplicitFollowUp: isExplicitFollowUp(text, intentResult?.intent, topic),
    isAmbiguous: intentResult?.intent === "desconocida" || intentResult?.intent === "ambiguo_real",
    questionCount: countQuestions(studentMessage)
  };
}

export function detectClinicalTopic({ text, intent, selectedInterventionType = "" }) {
  if (/\b(cerrar|terminar|dejamos hasta aqui|dejemoslo hasta aqui|nos vemos|hasta la proxima|para finalizar|para cerrar|seguir la proxima|sesion hasta aqui)\b/.test(text)) return "cierre";
  if (/\b(como te llamas|cual es tu nombre|dime tu nombre|quien eres)\b/.test(text)) return "identidad_nombre";
  if (/\b(que edad|cuantos anos|edad tienes)\b/.test(text)) return "edad";
  if (/\b(con quien vives|donde vives|vives solo|vives con)\b/.test(text)) return "convivencia";
  if (/\b(tienes hermanos|hermanos|hijo unico)\b/.test(text)) return "hermanos";
  if (/\b(desde cuando|hace cuanto|cuando empezo|cuando comenz[oó]|en que momento empezo|en que momento comenzo|cuando te empezaste|cuanto tiempo llevas)\b/.test(text)) return "temporal";
  if (/\b(confidencial|confidencialidad|quedara entre nosotros|queda entre nosotros|entre tu y yo|privado|estas de acuerdo con este encuadre)\b/.test(text)) return "confidencialidad";
  if (/\b(en que quieres que nos enfoquemos|en que te gustaria enfocarte|que te gustaria conversar|que quisieras conversar|que te gustaria trabajar|por donde te gustaria empezar)\b/.test(text)) return "foco_sesion";
  if (/\b(que te da miedo|cual es tu miedo|a que le tienes miedo|que es lo que temes|que te preocupa de (?:cambiar|decidir|equivocarte))\b/.test(text)) return "miedo_especifico";
  if (/\b(necesitas validar|validar todo|tener todo validado|estar completamente seguro|necesitas certeza|buscar certeza|tener garantias)\b/.test(text)) return "certeza_control";
  if (/\b(que situacion gatillo|que gatillo|de donde nace|que lo provoco|que crees que lo provoco|que desencadeno|que hizo que empezara|por que decidiste venir|que te llevo a consultar)\b/.test(text)) return "causal_gatillante";
  if (/\b(te da verguenza|verguenza|por que no te atreves|no te atreves|quieres decir algo|pudor|te cuesta profundizar|te cuesta hablar mas)\b/.test(text)) return "dificultad_profundizar";
  if (/\b(a que te refieres|que quieres decir|cuentame mas|explicame|eso que dijiste|mencionaste que|dijiste que)\b/.test(text)) {
    if (/\b(corresponde|deber|responsable|responsabilidad)\b/.test(text)) return "deber";
    if (/\b(separacion|ex pareja|expareja)\b/.test(text)) return "separacion";
    return "follow_up";
  }
  if (/\b(a que te dedicas|en que trabajas|trabajas|trabajo|pega|ocupacion)\b/.test(text)) return "estudios_trabajo";
  if (/\b(tienes amigos|amistades|con quien hablas|red de apoyo|personas cercanas)\b/.test(text)) return "amistades";
  if (/\b(quien te mando|quien te trajo|quien te pidio venir|viniste por tu cuenta|como llegaste)\b/.test(text)) return "derivacion";
  if (/\b(hacerte dano|hacerte algo|suicid|morir|no querer vivir|poner tu vida en peligro)\b/.test(text)) return "riesgo";
  if (/\b(separacion|separaste|ex pareja|expareja|relacion anterior)\b/.test(text)) return "separacion";
  if (/\b(cambio pequeno|paso pequeno|accion pequena|posible sostener|podrias sostener|empezar a mover)\b/.test(text)) return "recursos";
  if (/\b(rutina|dia a dia|todos los dias|dia habitual|un dia habitual|como es un dia|como son tus dias|piloto automatico|automatico)\b/.test(text)) return "rutina";
  if (/\b(decidir|decision|decisiones|posterg|equivocar|error|paraliz)\b/.test(text)) return "decisiones";
  if (/\b(valor|valores|que valoras|que valor te|importante para ti|vida que quieres|que quieres)\b/.test(text)) return "valores";
  if (/\b(recurso|recursos|que te ayuda|que te ha servido|apoyo|fortalezas|te sostiene)\b/.test(text)) return "recursos";
  if (/\b(familia|rol|lugar ocupas|relaciones|vinculos|personas cercanas)\b/.test(text)) return "contexto";
  if (/\b(que sientes|como te sientes|emocion|miedo|culpa|triste|cansancio|desgaste)\b/.test(text)) return "emociones";
  if (/\b(que esperas|como te gustaria que te ayud|que seria util|que necesitas)\b/.test(text)) return "ayuda";
  if (/\b(que te trae|por que estas aqui|por que viniste|motivo|que te pasa|que te ocurre)\b/.test(text)) return "motivo";
  if (/\b(hola|buenos dias|buenas tardes|buenas noches)\b/.test(text) && text.split(" ").length <= 6) return "saludo";
  if (/\b(objetivo|encuadre|confidencial|espacio|antes de comenzar|explicarte)\b/.test(text)) {
    return /\?|(que te gustaria|que quisieras|que esperas)/.test(text)
      ? "encuadre_mas_pregunta"
      : "encuadre";
  }
  const intentTopics = {
    identidad_nombre: "identidad_nombre",
    nombre: "identidad_nombre",
    edad: "edad",
    vivienda_residencia: "convivencia",
    convivencia_familia: "convivencia",
    hermanos: "hermanos",
    ocupacion_actividad: "estudios_trabajo",
    pregunta_laboral: "estudios_trabajo",
    amistades_red_social: "amistades",
    pregunta_social: "amistades",
    derivacion_llegada: "derivacion",
    derivacion_llegada_consulta: "derivacion",
    motivo_de_consulta: "motivo",
    preocupacion_principal: "motivo",
    exploracion_emocional: "emociones",
    pregunta_familiar: "contexto",
    exploracion_contextual: "contexto",
    preferencias_valoracion: "ayuda",
    saludo: "saludo",
    saludo_simple: "saludo",
    encuadre_o_consentimiento: "encuadre",
    encuadre: "encuadre",
    encuadre_mas_pregunta: "encuadre_mas_pregunta",
    encuadre_mas_pregunta_abierta: "encuadre_mas_pregunta",
    cierre: "cierre",
    riesgo: "riesgo"
  };
  if (intentTopics[intent]) return intentTopics[intent];

  const guidedTopics = {
    saludo_encuadre: "encuadre",
    motivo_consulta: "motivo",
    contexto_familiar_social: "contexto",
    ocupacion_vivienda: "estudios_trabajo",
    exploracion_emocional: "emociones",
    recursos_personales: "recursos",
    cierre_sesion: "cierre"
  };
  return guidedTopics[selectedInterventionType] || "follow_up";
}

function detectClinicalApproach(studentMessage) {
  const text = normalizeText(studentMessage);
  const solutionFocused = /\b(del 1 al 10|en una escala|que numero|subir de un|excepcion|cuando ocurre menos|pequeno paso|paso pequeno|que seria diferente|milagro)\b/.test(text);
  if (solutionFocused) return "solucion_breve";

  const narrativeCue = /\b(historia te cuentas|historia que te cuentas|relato dominante|otra historia|version de ti|definir el problema)\b/.test(text);
  if (narrativeCue) return "narrativo";

  const psychodynamicCue = /\b(patron|repeticion|se repite|defensa|historia familiar|infancia|vinculos tempranos|familia de origen)\b/.test(text);
  if (psychodynamicCue) return "psicodinamico";

  const report = analyzeTherapeuticApproaches([studentMessage]);
  const detected = report.detectedSignals || [];
  const integrationCue = /\b(piensas|pensamiento).*(sientes|emocion).*(haces|accion)|historia.*(ahora|accion)|miedo.*costumbre.*pensamiento\b/.test(text);
  if (report.mixedApproach || integrationCue) return "integrativo";

  const primaryId = report.primaryApproach?.id;
  return APPROACH_ALIASES[primaryId] || null;
}

function detectTaskKind({ text, sessionNumber, hasPreviousTask, practicalAct }) {
  const followUp = /\b(como te fue|hiciste la tarea|pudiste hacer|pudiste intentar|alcanzaste a|que notaste|te sirvio|revisaste el registro|hiciste el registro|anotaste)\b/.test(text);
  if (followUp) {
    if (!hasPreviousTask && sessionNumber > 1) return "noPreviousTask";
    if (/\b(te sirvio|que notaste|que aprendiste|que descubriste)\b/.test(text)) return "helpful";
    return "followUp";
  }

  if (practicalAct?.type !== "task_proposal") return null;

  const emotionallyPremature = sessionNumber <= 2 && /\b(habla con tu ex|enfrenta a|dile todo|cuentale todo|escribele una carta|escribas una carta|le escribas|revive|confronta)\b/.test(text);
  if (emotionallyPremature) return "emotionallyPremature";

  const tooBroad = /\b(cambia toda|cambiar toda tu vida|cambiar tu vida|renuncia|renunciar|deja tu trabajo|decide de una vez|resuelve esto|todos los dias|para siempre|haz todo)\b/.test(text);
  if (tooBroad) return "tooBroad";

  return "concrete";
}

function detectPracticalAct({ text, memory }) {
  const agendaCue = /\b(agendar|agendamos|coordinamos (?:la )?proxima sesion|puedes venir|podrias venir|te parece si vienes|vienes en|te espero|nos vemos el|nos vemos en|a las \d{1,2}|\d+\s*(?:dias|semanas) mas)\b/.test(text);
  if (agendaCue) return { type: "schedule", topic: "agenda_continuidad" };

  const taskContext = Boolean(
    memory?.taskAssigned
    || memory?.recentTurns?.some((turn) => /\b(tarea|anotar|registrar|escribir al final|te propongo)\b/.test(normalizeText(turn.studentMessage)))
  );
  const explicitTaskConfirmation = /\b(te parece bien lo que te propuse|estas de acuerdo con (?:esa|la) tarea|aceptas (?:esa|la) tarea|podrias hacer (?:esa|la) tarea|lo podrias hacer|puedes intentar lo que te propuse)\b/.test(text);
  const contextualTaskConfirmation = taskContext
    && /^(te parece|te parece bien|estas de acuerdo|lo podrias hacer|podrias hacerlo|puedes hacerlo)\??$/.test(text);
  if (explicitTaskConfirmation || contextualTaskConfirmation) {
    return { type: "task_confirmation", topic: "confirmacion_tarea" };
  }

  const taskCue = /\b(como tarea|te propongo|durante la semana|para la proxima)\b/.test(text)
    || /\b(podrias|te parece si|intenta|puedes)\b.{0,100}\b(anotar|anotas|escribir|escribes|registrar|registras|observar|observas|llevar un registro)\b/.test(text)
    || /\b(al finalizar (?:tu )?dia|al final del dia)\b.{0,100}\b(escribir|anotar|registrar|relatar)\b/.test(text);
  if (taskCue) return { type: "task_proposal", topic: "propuesta_tarea" };

  return null;
}

function describeTask(text, originalMessage) {
  const dailyEmotionalLog = /\b(escribir|escribes|escribas|anotar|anotas|anotes|registrar|registras|registres|relatar|relatas|relates)\b/.test(text)
    && /\b(dia|situacion|paso|ocurrio|afecto|emocion|positivo|negativo)\b/.test(text);
  if (dailyEmotionalLog) {
    return {
      type: "registro_diario_situaciones_emociones",
      description: "Escribir al final del día qué ocurrió y qué le afectó positiva o negativamente.",
      proposedText: originalMessage
    };
  }

  return {
    type: "tarea_concreta_personalizada",
    description: originalMessage.trim(),
    proposedText: originalMessage
  };
}

function detectPoorIntervention(text, originalMessage) {
  if (/\b(tienes|esto es|lo tuyo es|claramente tienes).*(depresion|ansiedad|trastorno|fobia|trauma|obsesion)\b/.test(text)) {
    return "prematureDiagnosis";
  }
  if (/\b(no es para tanto|estas exagerando|todos pasan por eso|deberias agradecer|eso no es grave|solo tienes que)\b/.test(text)) {
    return "invalidation";
  }
  const contextualObligation = /\b(cuando|si|cada vez que) tienes que\b/.test(text);
  if (!contextualObligation && /\b(tienes que|deberias|te recomiendo|lo mejor es|simplemente|hazlo y ya|deja de pensar)\b/.test(text)) {
    return /\b(ahora|de una vez|sin pensarlo|rapido)\b/.test(text) ? "pressure" : "rapidAdvice";
  }
  if (countQuestions(originalMessage) >= 3) return "interrogation";
  return null;
}

function detectGoodIntervention({ text, intent }) {
  if (/\b(si entiendo bien|por lo que dices|parece que|lo que escucho|suena como que)\b/.test(text)) return "reflection";
  if (intent === "validacion_emocional" || /\b(tiene sentido|comprendo|entiendo|gracias por contar|no tienes que resolver|podemos ir a tu ritmo|no voy a juzgar)\b/.test(text)) {
    return "validation";
  }
  if (/\b(resumiendo|en resumen|hemos hablado|lo que hemos visto|podriamos resumir)\b/.test(text)) return "summary";
  if (/\b(puedes tomarte tu tiempo|con calma|cuando te sientas listo|sin apurarte)\b/.test(text)) return "respectfulQuestion";
  return null;
}

function isExplicitFollowUp(text, intent, topic) {
  const explicitReference = /\b(a que te refieres|que quieres decir|cuentame mas|explicame|eso que dijiste|mencionaste que|dijiste que)\b/.test(text);
  if (explicitReference) return true;

  const briefWhy = /^(por que|porque|pq|xq)(\s+eso)?$/.test(text);
  if (briefWhy) return true;

  return topic === "follow_up" && [
    "seguimiento_contextual",
    "seguimiento_contextual_explicito",
    "seguimiento_contextual_breve",
    "seguimiento_emocional_contextual"
  ].includes(intent);
}

function countQuestions(message = "") {
  const punctuationCount = (String(message).match(/\?/g) || []).length;
  const questionWordCount = (normalizeText(message).match(/\b(que|como|cuando|donde|por que|cual|quien)\b/g) || []).length;
  return punctuationCount > 0 ? punctuationCount : questionWordCount;
}
