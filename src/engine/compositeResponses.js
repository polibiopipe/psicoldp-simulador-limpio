import { normalizeText } from "../utils/textUtils.js";

const compoundAcknowledgements = {
  tomas: "Ya, gracias.",
  valentina: "Gracias. Me ayuda saber que podemos ir con calma.",
  marcos: "Gracias. Me sirve que lo plantees así.",
  elena: "Muchas gracias. Me tranquiliza que podamos conversar con calma.",
  nicolas: "Ya. Mientras no sea como un reto, está bien.",
  camila: "Gracias. Me ayuda que sea un espacio donde pueda ir de a poco.",
  rodrigo: "Gracias. Me sirve saber cómo va a funcionar antes de partir.",
  fernanda: "Gracias. Me tranquiliza que podamos hacerlo con calma.",
  hector: "Bueno, entiendo.",
  daniela: "Gracias. Me ayuda saber que no tengo que resolver todo hoy.",
  andres: "Ya, gracias. Me sirve que lo expliques así.",
  patricia: "Gracias.",
  miguel: "Gracias. Me ayuda saber que es un espacio para conversar con calma.",
  sofia: "Gracias. Me ayuda que no suene como reto.",
  claudio: "Está bien."
};

const compoundOpenAnswers = {
  tomas: "Creo que me gustaría que entendieras que no es solo que juego mucho. También me cuesta estar con gente en persona.",
  valentina: "Me gustaría que entendieras que estoy cansada, pero me cuesta parar sin sentir culpa.",
  marcos: "Me gustaría que entendieras que sigo funcionando, pero cada vez con menos paciencia.",
  elena: "Me gustaría que entendieras que me cuesta pedir ayuda y no quiero preocupar a mis hijos.",
  nicolas: "Me gustaría que entendieras que no vine porque yo quisiera. Me mandaron, y me cuesta hablar si siento que ya decidieron por mí.",
  camila: "Me gustaría que entendieras que estoy cansada de estar disponible para todos, pero me da culpa decir que no.",
  rodrigo: "Me gustaría que entendieras que trato de mantenerme firme por mis hijos, pero la separación me mueve más de lo que muestro.",
  fernanda: "Me gustaría que entendieras que quiero volver al trabajo, pero me asusta que todos noten que no rindo como antes.",
  hector: "Me gustaría que entendieras que jubilar no ha sido solo tener tiempo libre. A veces siento que perdí un lugar.",
  daniela: "Me gustaría que entendieras que estoy cansada, pero también me siento culpable por estar cansada.",
  andres: "Me gustaría que entendieras que entré a la universidad, pero todavía siento que estoy mirando desde afuera.",
  patricia: "Me gustaría que entendieras que no quiero controlar todo, pero me da miedo perder el vínculo con mi hija.",
  miguel: "Me gustaría que entendieras que estoy intentando armar vida acá, pero a veces siento que empecé de cero.",
  sofia: "Creo que me gustaría que entendieras que me comparo más de lo que digo.",
  claudio: "Me gustaría que entendieras que no estoy mal en apariencia, pero siento que estoy viviendo en automático."
};

export function isCompositeOpenQuestionMessage(studentMessage = "") {
  const text = normalizeText(studentMessage);
  const hasFraming = [
    "antes de comenzar",
    "explicarte el objetivo",
    "objetivo de esta entrevista",
    "este es un espacio",
    "podemos conversar con calma",
    "no estoy para juzgarte",
    "quiero comprender"
  ].some((term) => text.includes(normalizeText(term)));

  const hasOpenQuestion = [
    "que te gustaria que entienda",
    "que te gustaria que entiendas",
    "que te gustaria que entendiera",
    "que te gustaria que comprendiera",
    "que quieres que comprenda",
    "que quieres que entienda",
    "que estas viviendo",
    "lo que estas viviendo",
    "que te trae hoy",
    "que te preocupa",
    "que seria importante que entienda"
  ].some((term) => text.includes(normalizeText(term)));

  return hasFraming && hasOpenQuestion;
}

export function forceCompositeOpenQuestionResponse(caseId, facts = {}) {
  const acknowledgement =
    compoundAcknowledgements[caseId] ||
    "Gracias. Me ayuda que podamos conversar con calma.";
  const openAnswer =
    compoundOpenAnswers[caseId] ||
    facts.concreteConcern ||
    facts.concern ||
    facts.motive ||
    "Me gustaría que entendieras lo que me está pasando sin apurar conclusiones.";

  return joinNatural(acknowledgement, openAnswer);
}

export function isIncompleteCompositeResponse(response = "") {
  const text = normalizeText(response);
  if (!text) return true;
  return !(
    text.includes("me gustaria que entendieras") ||
    text.includes("me gustaria que comprendieras") ||
    text.includes("creo que me gustaria que entendieras")
  );
}

function joinNatural(first, second) {
  if (!first) return second;
  if (!second) return first;
  const normalizedFirst = normalizeText(first);
  const normalizedSecond = normalizeText(second);
  if (normalizedFirst.includes(normalizedSecond) || normalizedSecond.includes(normalizedFirst)) return first;
  return `${first} ${second}`;
}
