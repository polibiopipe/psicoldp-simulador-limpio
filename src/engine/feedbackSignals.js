// Conservative text cues for formative review. These are not semantic judgments.
export const normalizeFeedbackText = (text = "") => String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

export function hasPatientBoundarySignal(text = "") {
  return /\b(prefiero no|no quiero (hablar|decir|contar|entrar|mencionar|dar)|no me siento comod[oa]|dejemos ese tema|prefiero reservar|me cuesta hablar de eso|no se si quiero contarlo)\b/.test(normalizeFeedbackText(text));
}

export function hasAutonomyRespect(text = "") {
  const value = normalizeFeedbackText(text);
  return /\b(no necesitas|no hace falta|podemos dejar|sin mencionar|sin decir|a tu ritmo|puedes no responder|no tienes que (contar|decir|hablar)|si (quieres|te parece))\b/.test(value);
}

export function isBoundaryPressure(question = "", previousPatientResponse = "") {
  if (!hasPatientBoundarySignal(previousPatientResponse)) return false;
  const value = normalizeFeedbackText(question);
  // Courtesy or permission in one clause must not cancel insistence in another.
  const affirmative = value.replace(/\bno (?:necesito|tienes que|debes)\b[^.!?;,]*/g, "");
  return /\b(por que no|dime|dimelo|necesito (saber|que me digas|que lo digas)|tienes que (decir|contar|hablar)|no evadas|responde|no puedes ocultarlo)\b/.test(affirmative);
}

export function isFormalOpenQuestion(question = "") {
  const value = normalizeFeedbackText(question);
  return /(?:^|[¿.!?]\s*)(?:y\s+)?(?:que|como|cuando|donde|cual|cuanto|por que|a que|en que|de que)\b/.test(value) || /\b(cuentame|ayudame a entender|me gustaria entender)\b/.test(value);
}

export function detectFeedbackSignals(question = "", previousPatientResponse = "") {
  const text = normalizeFeedbackText(question);
  // Avoid treating explicitly rejected or reported blame as the student's own blame.
  const ownSpeech = text
    .replace(/[“"«][^”"»]*[”"»]/g, "")
    .replace(/\b(?:no|tampoco|nunca) (?:es (?:tu culpa|culpa tuya)|eres (?:un |una )?floj[oa]|exageras|estas exagerando)\b/g, "")
    .replace(/\b(?:dices|dijiste|te dijeron|te dijo|te dicen|piensas|crees|sientes) que\b[^.!?;]*/g, "");
  const judgment = /\b(exageras|es tu culpa|es culpa tuya|floj[oa]|eso esta mal|deberias simplemente)\b/.test(ownSpeech);
  const adviceSpeech = ownSpeech.replace(/\bno (?:tienes que|debes|deberias|te recomiendo)\b[^.!?;,]*/g, "");
  const rushedAdvice = /\b(tienes que|deberias|te recomiendo|mi consejo|haz ejercicio|deja de|organizate|solamente debes)\b/.test(adviceSpeech);
  const prematureInterpretation = /\b(lo que te pasa es|claramente|eso significa|el problema es que|tu diagnostico es|parece que tienes)\b/.test(ownSpeech);
  const boundaryPressure = isBoundaryPressure(question, previousPatientResponse);
  const pressure = boundaryPressure || /\b(respondeme|responde ahora|dime ahora|no evadas|pero contesta)\b/.test(ownSpeech);
  const conflict = judgment || rushedAdvice || prematureInterpretation || pressure;
  const validationCue = /\b(entiendo|comprendo|tiene sentido|debe ser|suena|gracias por contar|es comprensible|no debe ser facil|me imagino)\b/.test(ownSpeech);
  const formulaOnly = /^(entiendo|comprendo|tiene sentido|gracias por contar(?:me)?)[.!\s]*$/.test(ownSpeech);
  const validation = validationCue && !conflict && !formulaOnly;
  const autonomyRespect = hasAutonomyRespect(question) && !conflict;
  const followUp = /\b(cuando (dices|mencionas|dijiste)|a que te refieres|cuentame mas|me dijiste|mencionaste|retomando|en que sentido|si entiendo bien|lo que escucho)\b/.test(text) && !conflict;
  const framing = /\b(confidencial\w*|encuadre)\b/.test(text) || /\b(?:el |nuestro )?(?:proposito|objetivo) (?:de (?:esta |la )?(?:entrevista|sesion)|del encuentro)\b/.test(text) || /\b(?:puedes no responder|a tu ritmo)\b/.test(text);
  const risk = /\b(suicid\w*|autolesion\w*|hacerte dano|danarte|no querer vivir|quitarte la vida|riesgo|morir)\b/.test(text);
  const closure = /\b(cerrar|terminar|finalizar|resum\w*|proxima sesion|continuar|seguimiento)\b/.test(text);
  const formalOpenQuestion = isFormalOpenQuestion(question);
  return { boundarySignalBefore: hasPatientBoundarySignal(previousPatientResponse), boundaryPressure, pressure, autonomyRespect, validationCue, validation, followUp, framing: framing && !conflict, risk, closure, judgment, rushedAdvice, prematureInterpretation, formalOpenQuestion, facilitativeOpenQuestion: formalOpenQuestion && !conflict, mixedMessage: validationCue && conflict };
}
