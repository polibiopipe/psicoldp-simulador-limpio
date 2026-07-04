import { tomasProfile } from "./profile.js";
import { tomasBiography } from "./biography.js";
import { tomasFamily } from "./family.js";
import { tomasPersonality } from "./personality.js";
import { tomasRelationships } from "./relationships.js";
import { tomasTimeline } from "./timeline.js";
import { tomasMemories } from "./memories.js";
import { tomasConsultation } from "./consultation.js";
import { tomasSymptoms } from "./symptoms.js";
import { tomasFunctioning } from "./functioning.js";
import { tomasMentalStatus } from "./mentalStatus.js";
import { tomasRisk } from "./risk.js";
import { tomasProtectiveFactors } from "./protectiveFactors.js";
import { tomasSocioculturalContext } from "./socioculturalContext.js";
import { tomasCommunicationStyle } from "./communicationStyle.js";
import { tomasDefenses } from "./defenses.js";
import { tomasSensitiveInfo } from "./sensitiveInfo.js";
import { tomasDisclosureRules } from "./disclosureRules.js";
import { tomasInterventionResponses } from "./interventionResponses.js";
import { tomasTaskResponses } from "./taskResponses.js";
import { tomasSessionEvolution } from "./sessionEvolution.js";
import { tomasClinicalObjectives } from "./clinicalObjectives.js";
import { tomasInstruments } from "./instruments.js";
import { tomasEvaluationCriteria } from "./evaluationCriteria.js";

export const tomasDeepPatient = {
  id: "tomas",
  fidelity: "deep-clinical-biographical-v1",
  profile: tomasProfile,
  identity: {
    ...tomasProfile,
    name: tomasProfile.name,
    age: tomasProfile.age,
    familyComposition: "Vivo con mi mama Carolina, mi papa Rodrigo y mi hermana Emilia."
  },
  summaryVisible: {
    mainTheme: tomasProfile.mainTheme,
    shortDescription: "Adolescente reservado, derivado por sus padres por aislamiento, videojuegos y dificultad para hablar en casa y en el colegio.",
    motiveForCard: "Aislamiento, discusiones por computador y ansiedad en interacciones presenciales.",
    initialPresentation: "Breve, defensivo y sensible a sentirse juzgado por el uso del computador."
  },
  biography: tomasBiography,
  biographyNarrative: tomasBiography.narrative,
  family: {
    composition: tomasFamily.composition,
    mother: tomasFamily.members.mother,
    father: tomasFamily.members.father,
    siblings: [tomasFamily.members.sister],
    partner: null,
    children: [],
    friends: tomasFamily.friends,
    map: tomasFamily
  },
  relationships: tomasRelationships,
  relationshipMap: tomasRelationships,
  timeline: tomasTimeline,
  memories: tomasMemories,
  consultation: tomasConsultation,
  symptoms: tomasSymptoms,
  symptomHistory: tomasSymptoms,
  functioning: tomasFunctioning,
  mentalStatus: tomasMentalStatus,
  risk: tomasRisk,
  riskMap: tomasRisk,
  protectiveFactors: tomasProtectiveFactors,
  socioculturalContext: tomasSocioculturalContext,
  communicationStyle: tomasCommunicationStyle,
  speakingStyle: tomasCommunicationStyle,
  defenses: tomasDefenses,
  sensitiveInfo: {
    ...tomasSensitiveInfo,
    items: tomasSensitiveInfo.items
  },
  disclosureRules: tomasDisclosureRules,
  disclosureMatrix: tomasDisclosureRules,
  interventionResponses: tomasInterventionResponses,
  taskResponses: tomasTaskResponses,
  sessionEvolution: tomasSessionEvolution,
  sessionPlan: {
    maxSessions: tomasSessionEvolution.maxAvailableSessions,
    expectedRange: tomasSessionEvolution.expectedSessions,
    expectedSessions: tomasSessionEvolution.expectedSessions,
    continueIf: tomasSessionEvolution.continueIf,
    closeIf: tomasSessionEvolution.closeIf,
    referIf: tomasSessionEvolution.referIf,
    riskProtocolIf: ["ideacion suicida activa", "riesgo vital", "violencia o vulneracion actual"],
    sessionGoals: {
      session1: [
        "Establecer encuadre con adolescente derivado.",
        "Explorar motivo visible sin patologizar videojuegos.",
        "Identificar estado emocional, familia y red de apoyo inicial."
      ],
      session2: [
        "Profundizar colegio, verguenza y experiencias de ridiculo.",
        "Explorar funcion del juego y red online."
      ],
      session3: [
        "Explorar dinamica familiar y culpa con madre/hermana.",
        "Diferenciar conflicto familiar de malestar social."
      ],
      session4: [
        "Construir hipotesis inicial y plan gradual.",
        "Evaluar riesgo si aparecen senales."
      ],
      session5: [
        "Practicar objetivos pequenos de comunicacion, regulacion y exposicion gradual."
      ]
    },
    betweenSessions: tomasSessionEvolution.betweenSessions
  },
  clinicalPlan: null,
  clinicalObjectives: tomasClinicalObjectives,
  instruments: tomasInstruments,
  evaluationCriteria: tomasEvaluationCriteria,
  evaluationRubric: tomasEvaluationCriteria,
  pedagogy: {
    goals: tomasClinicalObjectives,
    full: {
      objectives: tomasClinicalObjectives,
      instruments: tomasInstruments,
      criteria: tomasEvaluationCriteria
    },
    rubric: tomasEvaluationCriteria
  },
  emotionalState: {
    currentlyFeels: "Incomodo, cansado, juzgado y algo pasado a llevar por la forma en que se habla del computador.",
    worries: "Que todos crean que el problema es solo el computador y que le quiten el unico lugar donde se siente competente.",
    fears: "Quedar raro, decepcionar a su padre, preocupar a su madre y no servir fuera del juego.",
    shame: "Le da verguenza reconocer que en persona no sabe bien que decir.",
    needs: "Ser escuchado sin reto y que el mundo online no sea invalidado.",
    hides: "La tristeza despues de desconectarse y el miedo a no valer fuera del juego.",
    selfUnknown: "No entiende completamente por que estar con gente le agota o lo bloquea tanto.",
    expectations: "Espera que no lo traten como adicto ni como flojo."
  },
  personality: tomasPersonality,
  testQuestions: []
};

tomasDeepPatient.clinicalPlan = tomasDeepPatient.sessionPlan;

export {
  tomasProfile,
  tomasBiography,
  tomasFamily,
  tomasPersonality,
  tomasRelationships,
  tomasTimeline,
  tomasMemories,
  tomasConsultation,
  tomasSymptoms,
  tomasFunctioning,
  tomasMentalStatus,
  tomasRisk,
  tomasProtectiveFactors,
  tomasSocioculturalContext,
  tomasCommunicationStyle,
  tomasDefenses,
  tomasSensitiveInfo,
  tomasDisclosureRules,
  tomasInterventionResponses,
  tomasTaskResponses,
  tomasSessionEvolution,
  tomasClinicalObjectives,
  tomasInstruments,
  tomasEvaluationCriteria
};
