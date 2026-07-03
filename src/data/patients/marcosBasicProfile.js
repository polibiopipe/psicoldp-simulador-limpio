import { marcosPremiumPatient } from "./marcos/index.js";

export const marcosBasicProfile = {
  profile: {
    name: marcosPremiumPatient.identity.name,
    age: marcosPremiumPatient.identity.age,
    city: `${marcosPremiumPatient.identity.commune}, ${marcosPremiumPatient.identity.city}`,
    livesWith: "Vivo con mi pareja.",
    housingContext: "Vivimos en un departamento arrendado. La casa deberia ser un lugar para descansar, pero a veces llego irritable y eso tensiona la convivencia.",
    occupation: "Trabajo como coordinador de operaciones comerciales. Ultimamente la pega me esta dejando sin energia.",
    civilStatus: "Si, tengo pareja.",
    children: "No tengo hijos.",
    familySummary: "Mi nucleo mas cercano es mi pareja Paula. Tambien estan mi mama Teresa, mi papa Arturo y mi hermana Carolina, pero no suelo hablar mucho con ellos de lo que me pasa.",
    consultationReason: marcosPremiumPatient.consultation.whyNow,
    emotionalState: marcosPremiumPatient.emotionalState.currentlyFeels,
    supportNetwork: marcosPremiumPatient.identity.supportNetwork,
    routine: marcosPremiumPatient.identity.dailyRoutine,
    substances: marcosPremiumPatient.sensitiveInfo.substanceResponse,
    risk: marcosPremiumPatient.sensitiveInfo.riskResponse
  }
};
