import { claudioClinicalAvatar } from "./claudio.js";

export const clinicalAvatars = {
  claudio: claudioClinicalAvatar
};

export function getClinicalAvatar(caseId) {
  return clinicalAvatars[caseId] || null;
}
