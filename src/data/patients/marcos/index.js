import { marcosBiographyNarrative } from "./biographyNarrative.js";
import { marcosLifeTimeline } from "./lifeTimeline.js";
import { marcosSignificantScenes } from "./significantScenes.js";
import { marcosFamilyMap } from "./familyMap.js";
import { marcosRelationshipMap } from "./relationshipMap.js";
import { marcosWorkHistory } from "./workHistory.js";
import { marcosSymptomHistory } from "./symptomHistory.js";
import { marcosPsychodynamicMap } from "./psychodynamicMap.js";
import { marcosCognitiveBehavioralMap } from "./cognitiveBehavioralMap.js";
import { marcosSystemicMap } from "./systemicMap.js";
import { marcosHumanisticMap } from "./humanisticMap.js";
import { marcosRiskMap } from "./riskMap.js";
import { marcosDisclosureRules } from "./disclosureRules.js";
import { marcosSpeakingStyle } from "./speakingStyle.js";
import { marcosPedagogicalGoals } from "./pedagogicalGoals.js";
import { marcosEvaluationRubric } from "./evaluationRubric.js";
import { marcosSessionPlan } from "./sessionPlan.js";
import { marcosTestQuestions, marcosTestQuestionCount } from "./testQuestions.js";

export const marcosPremiumPatient = {
  id: "marcos",
  fidelity: "premium-biographical-v1",
  identity: {
    name: "Marcos",
    fullName: "Marcos Rojas Salinas",
    age: 38,
    gender: "masculino",
    city: "Santiago",
    commune: "Nunoa",
    education: "tecnico en administracion con continuidad en gestion de operaciones",
    occupation: marcosWorkHistory.currentRole,
    civilStatus: "Si, tengo pareja. Vivo con Paula.",
    partnerName: "Paula Herrera",
    children: "No tengo hijos.",
    livesWith: "Vivo con Paula, mi pareja.",
    housingType: "departamento arrendado",
    residenceExperience: "La casa deberia ser un lugar para descansar, pero a veces llego irritable y eso tensiona la convivencia.",
    residenceResponse: "Vivo en Nunoa, Santiago, en un departamento arrendado con Paula, mi pareja. La casa deberia ser para descansar, pero a veces llego tan irritable que termino llevando la pega para alla.",
    socioeconomicLevel: "medio",
    beliefsRelevant: "Valora la responsabilidad, el cumplimiento y no cargar a otros con problemas propios.",
    dailyRoutine: marcosSymptomHistory.patientLanguage.firstLayer
      ? "Trabajo, vuelvo a la casa con poca energia y muchas veces sigo pensando en pendientes. Duermo, pero no siempre descanso."
      : "Trabajo y vuelvo cansado a casa.",
    supportNetwork: "Paula es quien mas nota lo que me pasa. Tengo amigos y familia, pero no suelo hablar de estas cosas con ellos."
  },
  summaryVisible: {
    mainTheme: "Estres laboral, irritabilidad y culpa relacional",
    shortDescription: "Adulto que sigue funcionando laboralmente, pero llega agotado a casa, responde corto y empieza a temer que su cansancio este danando sus vinculos.",
    motiveForCard: "Cansancio persistente, irritabilidad y dificultad para separar trabajo y vida personal.",
    initialPresentation: "Correcto, sobrio, minimiza el malestar y lo presenta como cansancio de la pega."
  },
  biographyNarrative: marcosBiographyNarrative,
  biography: {
    childhood: "Infancia ordenada en una familia trabajadora donde aprendio a leer el animo de los adultos y a no pedir demasiado.",
    caregivers: "Teresa cuidaba con actos y exigencia; Arturo encarnaba responsabilidad silenciosa y cansancio que ordenaba la casa.",
    school: "Buen rendimiento por constancia; verguenza marcada en exposiciones.",
    adolescence: "Pertenencia discreta, evitacion de conflicto, culpa por no intervenir cuando otros eran molestados.",
    significantRelationships: "Paula es el vinculo actual mas importante y quien nombra su distancia emocional.",
    studies: "Elige administracion por estabilidad y continuidad laboral.",
    work: marcosWorkHistory.currentRole,
    losses: "No hay duelo central; si hay perdida progresiva de descanso, juego y presencia.",
    majorChanges: "Convivencia con Paula y aumento de urgencias laborales fuera de horario.",
    criticalEvents: "Discusion con Paula y escena posterior en el bano donde teme parecerse a su padre.",
    currentSituation: "Consulta por cansancio, irritabilidad, culpa y dificultad para pedir ayuda."
  },
  timeline: marcosLifeTimeline,
  significantScenes: marcosSignificantScenes,
  family: {
    composition: marcosFamilyMap.composition,
    mother: marcosFamilyMap.members.mother,
    father: marcosFamilyMap.members.father,
    siblings: [marcosFamilyMap.members.sister],
    partner: marcosFamilyMap.members.partner,
    children: [],
    friends: [
      "amigos de colegio y futbol con quienes se ha distanciado por cansancio",
      "companeros de trabajo con trato cordial, no intimo"
    ],
    map: marcosFamilyMap
  },
  relationshipMap: marcosRelationshipMap,
  workHistory: marcosWorkHistory,
  symptomHistory: marcosSymptomHistory,
  psychodynamicMap: marcosPsychodynamicMap,
  cognitiveBehavioralMap: marcosCognitiveBehavioralMap,
  systemicMap: marcosSystemicMap,
  humanisticMap: marcosHumanisticMap,
  riskMap: marcosRiskMap,
  disclosureMatrix: marcosDisclosureRules,
  speakingStyle: marcosSpeakingStyle,
  personality: {
    temperament: "responsable, contenido, autoexigente, cordial y con irritabilidad contenida",
    anxietyLevel: "moderado, expresado como control y anticipacion",
    initialOpenness: "baja-media",
    responseStyle: "sobrio, concreto, minimiza al inicio y profundiza si no se siente juzgado",
    defenses: marcosPsychodynamicMap.predominantDefenses.map((item) => item.defense),
    humor: "seco y ocasional, usado para bajar intensidad",
    trustInitial: 9,
    resistances: ["consejos rapidos", "acusarlo de ser igual al padre", "diagnosticos prematuros", "preguntas bruscas por riesgo"],
    typicalPhrases: marcosSpeakingStyle.typicalPhrases,
    avoids: ["llamarlo tristeza", "miedo a parecerse al padre", "sentirse util solo por rendir", "fantasia de apagar todo"],
    mobilizers: ["encuadre claro", "validacion sin dramatizar", "preguntas concretas", "seguimiento de culpa y casa"],
    emotionalRhythm: "abre desde cansancio hacia culpa, luego verguenza y finalmente miedo si hay confianza",
    unknownAnswer: "No lo tengo tan claro. Nunca lo habia pensado asi, pero puedo intentar mirarlo."
  },
  emotionalState: {
    currentlyFeels: "Cansado, irritable, culpable y preocupado por llegar apagado a la casa.",
    worries: "Le preocupa danar su relacion con Paula y volverse parecido al padre cuando llega agotado.",
    fears: "Fallar, bajar el ritmo, decepcionar y dejar de ser necesario.",
    shame: "Le da verguenza necesitar ayuda cuando desde afuera sigue funcionando.",
    needs: "Necesita poder descansar y pedir ayuda sin sentir que falla.",
    hides: "Miedo a parecerse al padre, rabia hacia demandas laborales y temor de valer solo por rendimiento.",
    selfUnknown: "No entiende completamente por que no puede cortar con la pega incluso cuando sabe que le hace mal.",
    expectations: "Quiere entender que le pasa sin que lo empujen a una decision rapida."
  },
  consultation: {
    manifestMotive: "Cansancio persistente, irritabilidad, sobrecarga laboral y tension en la convivencia.",
    whyNow: "Vine porque ando cansado, mas irritable, y siento que la pega se me esta metiendo a la casa.",
    recentTrigger: "Una discusion con Paula, despues de mirarle poco mientras ella hablaba, lo dejo con culpa y miedo de estar repitiendo un patron familiar.",
    whyNotBefore: "Como seguia funcionando, penso que no era para tanto y que deberia manejarlo solo.",
    motivatedBy: "Paula lo sugirio, pero el acepta porque siente que algo se acumulo.",
    expects: "Poder ordenar lo que le pasa sin sonar como que se queja ni recibir consejos rapidos.",
    fearsTherapy: "Teme que lo juzguen, que exageren el riesgo o que lo empujen a soluciones que no puede sostener.",
    beliefAboutProblem: "No cree que sea solo estres laboral; empieza a notar que afecta su forma de estar con quienes quiere."
  },
  sensitiveInfo: {
    earlyBoundary: "Puede tener relacion con mi historia, pero me cuesta entrar tan rapido en eso. Por ahora me sale mas hablar del cansancio y de como llego a la casa.",
    riskResponse: marcosRiskMap.suicidalIdeation.carefulQuestionResponse,
    substanceResponse: marcosRiskMap.substanceUse.response,
    items: marcosDisclosureRules.sensitiveItems
  },
  disclosureRules: marcosDisclosureRules,
  pedagogy: {
    goals: marcosPedagogicalGoals.learningObjectives,
    full: marcosPedagogicalGoals,
    rubric: marcosEvaluationRubric
  },
  sessionPlan: marcosSessionPlan,
  clinicalPlan: marcosSessionPlan,
  evaluationRubric: marcosEvaluationRubric,
  testQuestions: marcosTestQuestions,
  testQuestionCount: marcosTestQuestionCount
};

export {
  marcosBiographyNarrative,
  marcosLifeTimeline,
  marcosSignificantScenes,
  marcosFamilyMap,
  marcosRelationshipMap,
  marcosWorkHistory,
  marcosSymptomHistory,
  marcosPsychodynamicMap,
  marcosCognitiveBehavioralMap,
  marcosSystemicMap,
  marcosHumanisticMap,
  marcosRiskMap,
  marcosDisclosureRules,
  marcosSpeakingStyle,
  marcosPedagogicalGoals,
  marcosEvaluationRubric,
  marcosSessionPlan,
  marcosTestQuestions
};
