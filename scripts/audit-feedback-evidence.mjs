import assert from "node:assert/strict";
import { buildSessionFeedback } from "../src/engine/sessionFeedback.js";

const caseItem = { id: "valentina", name: "Valentina" };

testBoundaryPressure();
testBoundaryRespect();
testValidationAndFollowUp();
testPrematureAdviceAndHypothesis();
testClosureAndEvidenceLevels();

console.log("audit:feedback ok - análisis contextual de retroalimentación verificado.");

function build(conversation, extra = {}) {
  return buildSessionFeedback({
    sessionNumber: extra.sessionNumber || 1,
    selectedCase: caseItem,
    conversation,
    report: {
      caseName: caseItem.name,
      strengths: [],
      improvements: [],
      trust: { label: "cautelosa", final: 45, delta: 0 }
    },
    clinicalDecision: extra.clinicalDecision || null
  });
}

function testBoundaryPressure() {
  const feedback = build([
    {
      id: "turn-1",
      question: "¿Qué carrera estudias?",
      answer: "Prefiero no decir el nombre exacto de la carrera."
    },
    {
      id: "turn-2",
      question: "POR QUE NO LO QUIERES DECIR?",
      answer: "No sé, prefiero dejarlo así."
    }
  ]);
  const pressured = feedback.observedActions[1];
  assert.equal(pressured.formalOpenQuestion, true);
  assert.equal(pressured.facilitativeOpenQuestion, false);
  assert.equal(pressured.boundaryPressure, true);
  assert.equal(pressured.autonomyRespect, false);
  assert.match(feedback.priorityImprovements.join(" "), /POR QUE NO LO QUIERES DECIR/i);
  assert.match(pressured.reformulation, /no necesitas decir el nombre/i);
}

function testBoundaryRespect() {
  const feedback = build([
    {
      id: "turn-1",
      question: "¿Qué carrera estudias?",
      answer: "Prefiero no decir el nombre exacto de la carrera."
    },
    {
      id: "turn-2",
      question: "Está bien, podemos hablar de cómo te afecta sin mencionar el nombre.",
      answer: "Sí, eso me acomoda más."
    }
  ]);
  const respected = feedback.observedActions[1];
  assert.equal(respected.boundaryPressure, false);
  assert.equal(respected.autonomyRespect, true);
  assert.match(feedback.strengths.join(" "), /autonomía|límite/i);
}

function testValidationAndFollowUp() {
  const feedback = build([
    {
      id: "turn-1",
      question: "Entiendo que debe ser pesado. Cuando dices que te absorbe, ¿a qué te refieres?",
      answer: "A que siento que todo gira alrededor de rendir."
    }
  ]);
  const action = feedback.observedActions[0];
  assert.equal(action.validation, true);
  assert.equal(action.followUp, true);
  assert.equal(action.facilitativeOpenQuestion, true);
}

function testPrematureAdviceAndHypothesis() {
  const feedback = build([
    {
      id: "turn-1",
      question: "Tienes que organizarte mejor y dejar de compararte.",
      answer: "No sé si es tan simple."
    },
    {
      id: "turn-2",
      question: "Claramente tu problema es perfeccionismo.",
      answer: "Puede ser, pero me suena raro escucharlo así."
    }
  ]);
  assert.equal(feedback.observedActions[0].rushedAdvice, true);
  assert.equal(feedback.observedActions[1].prematureInterpretation, true);
  assert.match(feedback.priorityImprovements.join(" "), /consejo|hipótesis/i);
}

function testClosureAndEvidenceLevels() {
  assert.equal(build([]).evidenceLevel.key, "not_evaluable");
  assert.equal(build(makeTurns(1)).evidenceLevel.key, "very_preliminary");
  assert.equal(build(makeTurns(5)).evidenceLevel.key, "limited");
  assert.equal(build(makeTurns(12)).evidenceLevel.key, "sufficient");

  const feedback = build([
    ...makeTurns(4),
    {
      id: "closure",
      question: "Antes de cerrar, resumo lo que apareció y podemos retomarlo en una próxima sesión.",
      answer: "Sí, me hace sentido."
    }
  ]);
  assert.equal(feedback.observedActions.at(-1).closure, true);
}

function makeTurns(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `turn-${index + 1}`,
    question: index % 2 === 0
      ? "¿Qué te gustaría que entienda de lo que estás viviendo?"
      : "Entiendo. ¿Cómo ha sido para ti sostener eso esta semana?",
    answer: "Me ha costado ordenarlo, pero puedo contarlo de a poco."
  }));
}
