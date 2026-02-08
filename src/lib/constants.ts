export const AUDIENCES = [
  { value: "hospital_compliance", label: "Hospital Compliance" },
  { value: "insurer", label: "Insurer" },
  { value: "regulator", label: "Regulator" },
] as const;

export const TONES = [
  { value: "neutral", label: "Neutral" },
  { value: "firm", label: "Firm" },
  { value: "collaborative", label: "Collaborative" },
] as const;

export const ROLES = [
  { value: "patient", label: "Patient" },
  { value: "caregiver", label: "Caregiver" },
  { value: "clinician", label: "Clinician" },
  { value: "advocate", label: "Advocate" },
] as const;

export const CARE_SETTINGS = [
  { value: "primary_care", label: "Primary Care" },
  { value: "hospital_discharge", label: "Hospital Discharge" },
  { value: "insurer_care_management", label: "Insurer Care Management" },
  { value: "specialty", label: "Specialty" },
  { value: "other", label: "Other" },
] as const;

export const CHECKLIST_ITEMS = [
  { id: "denied_service", label: "I was denied a service or referral" },
  { id: "algorithm_mentioned", label: "An algorithm or score was mentioned" },
  { id: "cost_cited", label: "Cost or utilization data was cited as a reason" },
  { id: "no_explanation", label: "No clear explanation was given for the decision" },
  { id: "appeal_denied", label: "My appeal was denied or not offered" },
  { id: "different_treatment", label: "Others with similar needs received different treatment" },
  { id: "care_delayed", label: "My care was delayed" },
  { id: "discharged_early", label: "I was discharged earlier than expected" },
  { id: "prior_auth_denied", label: "Prior authorization was denied" },
  { id: "risk_score_used", label: "A risk score was used in decision-making" },
] as const;

export const REPORT_TAGS = [
  "denied_service",
  "algorithm_mentioned",
  "cost_cited",
  "no_explanation",
  "appeal_denied",
  "care_delayed",
  "discharged_early",
  "prior_auth_denied",
  "risk_score_used",
] as const;

export const VISIBILITIES = [
  { value: "private", label: "Private (only you can see)" },
  { value: "shared_anonymous", label: "Shared anonymously" },
  { value: "shared_username", label: "Shared with your display name" },
] as const;

// PHI detection patterns
export const PHI_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // phone
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\bMRN\s*[:#]?\s*\d+/i, // MRN
  /\bDOB\s*[:#]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i, // DOB
  /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](\d{4}|\d{2})\b/, // date pattern
] as const;

export function containsPHI(text: string): boolean {
  return PHI_PATTERNS.some((pattern) => pattern.test(text));
}
