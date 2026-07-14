import { getAvatarCanonicalBiography } from "./avatarCanonicalBiographies.js";

export const caseFacts = {
  tomas: {
    name: "Tomás",
    age: 18,
    studies: "sí, colegio",
    works: "no",
    livesWith: "sus papás y una hermana menor",
    family: "sus padres están preocupados por el computador y porque casi no sale",
    friends: "pocos presenciales, más contactos online",
    videogames: "juega frecuentemente",
    referral: "preocupación familiar por aislamiento y videojuegos",
    mainConcern: "tensión familiar y dificultad para relacionarse presencialmente"
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
    studies: "sí, colegio",
    works: "no",
    livesWith: "su familia",
    family: "en casa suelen preguntar por notas y colegio",
    friends: "se ha desconectado de sus compañeros",
    videogames: "a veces juega o ve videos para distraerse",
    referral: "derivación escolar por baja participación y cambios en rendimiento",
    mainConcern: "sentirse etiquetado y poco escuchado"
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
