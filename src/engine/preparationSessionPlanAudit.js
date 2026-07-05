import assert from "node:assert/strict";
import {
  SESSION_COUNT_LIMITS,
  ethicalCareChecklist,
  evaluatePreSessionReadiness
} from "./clinicalPreparation.js";
import {
  getAvailableSessionNumbers,
  getCompletedSessionCount,
  getProcessSessionTotal
} from "./sessionPlanUtils.js";

const completeButWeakPlan = {
  evaluationObjective: "ver",
  proposedSessionCount: 4,
  sessionCountJustification: "breve",
  processObjectives: "algo",
  interviewType: "semiestructurada",
  interviewJustification: "porque si",
  explorationAreas: ["motivo_consulta"],
  ethicalCareItems: ["confidencialidad"],
  priorityInformation: "riesgo"
};

const strongPlan = {
  evaluationObjective: "Comprender el motivo de consulta inicial y su impacto cotidiano.",
  proposedSessionCount: 4,
  sessionCountJustification: "Propongo cuatro sesiones para explorar motivo, riesgo, apoyos y continuidad.",
  processObjectives: "Delimitar el problema, evaluar recursos, revisar riesgos y acordar siguientes pasos.",
  interviewType: "semiestructurada",
  interviewJustification: "Permite equilibrar escucha clinica con exploracion de areas prioritarias.",
  explorationAreas: ["motivo_consulta", "estado_emocional", "funcionamiento_diario", "red_apoyo"],
  ethicalCareItems: ethicalCareChecklist.slice(0, 4).map((item) => item.id),
  priorityInformation: "Inicio del malestar, impacto funcional, red de apoyo y riesgo actual."
};

const weakReadiness = evaluatePreSessionReadiness(completeButWeakPlan);
assert.equal(weakReadiness.requiredComplete, true, "Campos completos no deben bloquear inicio.");
assert.equal(weakReadiness.qualityComplete, false, "Campos breves deben marcar preparacion debil.");
assert.ok(weakReadiness.weakReasons.length > 0, "Preparacion debil debe explicar que mejorar.");

const emptyReadiness = evaluatePreSessionReadiness({
  ...completeButWeakPlan,
  priorityInformation: ""
});
assert.equal(emptyReadiness.requiredComplete, false, "Campo vacio debe bloquear inicio.");
assert.ok(emptyReadiness.missingReasons.length > 0, "Campo vacio debe reportar pendiente.");

const strongReadiness = evaluatePreSessionReadiness(strongPlan);
assert.equal(strongReadiness.requiredComplete, true, "Preparacion completa debe permitir inicio.");
assert.equal(strongReadiness.qualityComplete, true, "Preparacion suficiente no debe advertir debilidad.");

const afterOneSession = [{ sessionNumber: 1, preSessionPlan: { proposedSessionCount: 4 } }];
assert.equal(
  getProcessSessionTotal({ proposedSessionCount: 9 }, afterOneSession),
  9,
  "Aumentar de 4 a 9 debe conservar memoria y ampliar plan."
);
assert.deepEqual(
  getAvailableSessionNumbers(afterOneSession, 9),
  [1, 2],
  "Tras sesion 1 de 9 debe quedar disponible sesion 2 sin borrar sesion 1."
);

const afterThreeSessions = [
  { sessionNumber: 1 },
  { sessionNumber: 2 },
  { sessionNumber: 3 }
];
assert.equal(
  getProcessSessionTotal({ proposedSessionCount: 5 }, afterThreeSessions),
  5,
  "Reducir de 9 a 5 con 3 realizadas debe conservar memoria y ajustar futuras."
);

const afterFiveSessions = Array.from({ length: 5 }, (_, index) => ({ sessionNumber: index + 1 }));
assert.equal(getCompletedSessionCount(afterFiveSessions), 5, "Debe contar sesiones historicas realizadas.");
assert.equal(
  getProcessSessionTotal({ proposedSessionCount: 4 }, afterFiveSessions),
  5,
  "Plan menor que sesiones realizadas no debe borrar ni ocultar memoria historica."
);
assert.deepEqual(
  getAvailableSessionNumbers(afterFiveSessions, 4),
  [1, 2, 3, 4, 5],
  "Sesiones realizadas deben seguir visibles aunque el plan baje."
);

assert.equal(SESSION_COUNT_LIMITS.max >= 9, true, "El prototipo debe permitir reevaluar hasta al menos 9 sesiones.");

console.log("preparationSessionPlanAudit: ok");
