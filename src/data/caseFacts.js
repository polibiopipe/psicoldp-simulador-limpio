import { getAvatarCanonicalBiography } from "./avatarCanonicalBiographies.js";

export const caseFacts = {
  tomas: {
    name: "Tomás",
    age: 18,
    studies: "sí, cerrando cuarto medio",
    works: "no",
    livesWith: "su mamá Carolina, su papá Rodrigo y su hermana menor Emilia",
    family: "Carolina y Rodrigo están preocupados por el computador, el aislamiento y las decisiones posteriores al colegio",
    friends: "pocos presenciales, más contactos online",
    videogames: "juega frecuentemente",
    referral: "preocupación familiar por aislamiento, videojuegos y transición posterior al colegio",
    mainConcern: "tensión familiar, dificultad para relacionarse presencialmente y temor a decidir qué hará después del colegio"
  },
  valentina: {
    name: "Valentina",
    age: 21,
    studies: "sí, universidad",
    works: "no formalmente",
    livesWith: "su familia",
    family: "su familia confía mucho en ella y espera alto rendimiento",
    friends: "tiene amigas, pero suele postergar vínculos por estudiar",
    videogames: "no es un tema relevante en su caso",
    referral: "consulta por sobrecarga académica y cansancio",
    mainConcern: "sobrecarga académica, autoexigencia y culpa al descansar"
  },
  marcos: {
    name: "Marcos",
    age: 38,
    studies: "no actualmente",
    works: "sí",
    livesWith: "su pareja",
    family: "le preocupa llegar irritable a la casa",
    friends: "tiene amigos, pero habla poco de lo que le pasa",
    videogames: "no es un tema relevante en su caso",
    referral: "su pareja le sugirió hablar con alguien",
    mainConcern: "cansancio, irritabilidad y estrés laboral"
  },
  elena: {
    name: "Elena",
    age: 52,
    studies: "no actualmente",
    works: "algunas horas",
    livesWith: "pasa mucho tiempo sola",
    family: "tiene hijos y no quiere preocuparlos",
    friends: "tiene amigas, pero le cuesta pedir compañía",
    videogames: "no es un tema relevante en su caso",
    referral: "consulta por soledad y cambios familiares",
    mainConcern: "soledad, conflictos familiares y dificultad para pedir ayuda"
  },
  nicolas: {
    name: "Nicolás",
    age: 18,
    studies: "sí, cuarto medio",
    works: "no",
    livesWith: "su familia",
    family: "en casa suelen preguntar por notas, colegio y decisiones posteriores al egreso",
    friends: "se ha desconectado de sus compañeros",
    videogames: "a veces juega o ve videos para distraerse",
    referral: "derivación escolar por baja participación, cambios en rendimiento y paralización ante decisiones posteriores al colegio",
    mainConcern: "sentirse etiquetado, poco escuchado y no preparado para elegir qué hará después del colegio"
  }
};

for (const caseId of Object.keys(caseFacts)) {
  const biography = getAvatarCanonicalBiography(caseId);
  if (!biography) continue;

  Object.assign(caseFacts[caseId], {
    name: biography.identity.preferredName,
    age: biography.identity.age,
    studies: biography.education.program || biography.education.status,
    works: /sin empleo formal/i.test(biography.employment.status || "")
      ? "no formalmente"
      : biography.employment.role,
    livesWith: biography.identity.livingWith.join(", "),
    family: biography.family.familyRole,
    friends: biography.relationships.supportNetwork.join(", "),
    referral: biography.consultation.whoSuggestedIt,
    mainConcern: biography.consultation.concerns || biography.internalConflict
  });
}
