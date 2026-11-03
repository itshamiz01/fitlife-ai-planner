/** Deterministic reference estimates; not a medical prescription.
 * Method: docs/HYDRATION_METHODOLOGY.md. No AI, network or patient inference.
 */
export type HydrationInputs = {
  age: number;
  weightKg: number;
  safety: { fluidRestriction: boolean | null; fluidBalanceCondition: boolean | null; pregnantOrBreastfeeding: boolean | null; fluidAffectingMedication: boolean | null };
  clinicianFluidMl?: number | null; // Clinician-provided limit/target for ALL drinks, not just plain water.
  otherBeveragesMl?: number | null; // User-estimated water from other drinks, not logged plain water.
  foodWaterMl?: number | null; // User-supplied estimate, not automatically assumed.
  workEnvironment: string;
  activity: "sedentary" | "light" | "moderate" | "very" | "heavy";
  heat: "cool" | "moderate" | "hot" | "unknown";
  outdoorHours: number;
  sweating: "low" | "moderate" | "heavy" | "unknown";
  exerciseMinutes: number;
};
type Range = { minMl: number; maxMl: number };
export type HydrationEstimate = {
  methodVersion: "hydration-v1-draft";
  status: "estimate" | "clinician-target" | "clinician-guidance" | "safety-answers-needed";
  beverageRange: Range | null;
  plainWaterRange: Range | null;
  totalWaterRange: Range | null;
  otherBeveragesMl: number | null;
  foodWaterMl: number | null;
  explanations: string[];
  warnings: string[];
};
const VERSION = "hydration-v1-draft" as const;
const rounded = (n: number) => Math.round(n / 100) * 100;
const finiteBetween = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const optionalMl = (n: unknown, label: string) => {
  if (n === undefined || n === null) return null;
  if (!finiteBetween(n, 0, 10000)) throw new RangeError(`${label} must be between 0 and 10000 ml.`);
  return n;
};
export function estimateHydration(input: HydrationInputs): HydrationEstimate {
  if (!input || !finiteBetween(input.age, 0, 120) || !Number.isInteger(input.age) || !finiteBetween(input.weightKg, 12, 400) || !finiteBetween(input.outdoorHours, 0, 24) || !finiteBetween(input.exerciseMinutes, 0, 1440) || !["sedentary", "light", "moderate", "very", "heavy"].includes(input.activity) || !["cool", "moderate", "hot", "unknown"].includes(input.heat) || !["low", "moderate", "heavy", "unknown"].includes(input.sweating) || typeof input.workEnvironment !== "string" || input.workEnvironment.length > 120 || !input.safety || Object.values(input.safety).length !== 4 || [input.safety.fluidRestriction, input.safety.fluidBalanceCondition, input.safety.pregnantOrBreastfeeding, input.safety.fluidAffectingMedication].some(v => v !== true && v !== false && v !== null)) throw new RangeError("Invalid hydration profile.");
  const clinician = optionalMl(input.clinicianFluidMl, "Clinician fluid amount");
  if (clinician === 0) throw new RangeError("A clinician-provided amount must be greater than zero.");
  const other = optionalMl(input.otherBeveragesMl, "Other beverages");
  const food = optionalMl(input.foodWaterMl, "Food water");
  const warnings = ["Your hydration target is an estimate based on your profile and daily routine. It is not a medical prescription. Individual fluid requirements vary. Follow your healthcare professional's instructions if you have a medical condition or prescribed fluid restriction.", "Avoid forcing fluids or drinking large amounts quickly. Too much water can be dangerous.", "Heat exposure with confusion, fainting, seizures or severe weakness needs urgent medical help and cooling, not simply more water. Do not give drinks to someone who cannot safely swallow."];
  const explanations: string[] = [];
  const incomplete = Object.values(input.safety).some(value => value === null);
  const higherRisk = input.age < 18 || input.age >= 65 || Object.values(input.safety).some(value => value === true);
  const make = (status: HydrationEstimate["status"], beverageRange: Range | null): HydrationEstimate => {
    const plainWaterRange = beverageRange && other !== null ? { minMl: Math.max(0, beverageRange.minMl - other), maxMl: Math.max(0, beverageRange.maxMl - other) } : null;
    const totalWaterRange = beverageRange && food !== null ? { minMl: beverageRange.minMl + food, maxMl: beverageRange.maxMl + food } : null;
    if (other === null) explanations.push("Plain-water amount is unavailable until you estimate water from other drinks. Do not count them twice.");
    if (food === null) explanations.push("Total water from all sources is unavailable without an estimate of water in food.");
    return { methodVersion: VERSION, status, beverageRange, plainWaterRange, totalWaterRange, otherBeveragesMl: other, foodWaterMl: food, explanations, warnings };
  };
  if (incomplete) { explanations.push("Answer all optional safety questions before any automatic estimate; choose clinician guidance if unsure."); return make("safety-answers-needed", null); }
  if (higherRisk) {
    if (clinician !== null) { explanations.push("A clinician-provided daily limit or target for all beverages takes priority. No activity, heat or exercise amount is added."); return make("clinician-target", { minMl: clinician, maxMl: clinician }); }
    explanations.push("Because of age or a reported safety concern, ask a clinician for an individual fluid target. No automatic target or increase is calculated."); return make("clinician-guidance", null);
  }
  if (clinician !== null) { explanations.push("Your clinician-provided daily amount for all drinks takes priority; no automatic additions are made."); return make("clinician-target", { minMl: clinician, maxMl: clinician }); }
  // Conservative product gating, not a clinical cut-off: avoid extrapolating this draft
  // heuristic far outside typical body weights or producing a very high routine target.
  if (input.weightKg < 40 || input.weightKg > 120 || input.weightKg * 35 > 4000) { explanations.push("This draft estimator is not validated for this body weight. Ask a clinician for individualized guidance."); return make("clinician-guidance", null); }
  const range = { minMl: rounded(input.weightKg * 30), maxMl: rounded(input.weightKg * 35) };
  explanations.push(`Starting beverage range is a rough 30–35 ml/kg heuristic using ${input.weightKg} kg, rounded to 100 ml. It is adapted from a hospital oral-fluid policy, not a validated personal requirement for healthy outpatients.`);
  explanations.push(`Work: ${input.workEnvironment || "not specified"}; activity: ${input.activity}; outdoor exposure: ${input.outdoorHours} hours; conditions: ${input.heat}; sweating: ${input.sweating}. Work title alone does not establish workload.`);
  if (input.heat === "hot" || input.sweating === "heavy" || input.activity === "heavy" || input.activity === "very") explanations.push("Heat, physical work and sweating can increase fluid losses, but this tool does not estimate an extra volume from categories alone. Plan cool rest, access to safe water and individual guidance.");
  if (input.sweating === "heavy" || input.exerciseMinutes >= 60) explanations.push("During prolonged heavy sweating, sodium replacement can matter. Avoid excessive plain water; seek individualized guidance rather than automatically taking salt tablets or supplements.");
  if (input.exerciseMinutes > 0) explanations.push(`Exercise reported: ${input.exerciseMinutes} minutes. Sweat loss varies; do not automatically add exercise fluid to an already adjusted daily target.`);
  return make("estimate", range);
}
/** Field estimate, in liters; negative results indicate unreliable inputs, not negative sweating. */
export function exerciseSweatLoss(preKg: number, postKg: number, fluidLiters: number, urineLiters: number) {
  if (!finiteBetween(preKg, 12, 400) || !finiteBetween(postKg, 12, 400) || !finiteBetween(fluidLiters, 0, 10) || !finiteBetween(urineLiters, 0, 10)) throw new RangeError("Invalid sweat-loss measurements.");
  const liters = Math.round((preKg - postKg + fluidLiters - urineLiters) * 1000) / 1000;
  if (liters < 0 || liters > 10) throw new RangeError("Measurements do not yield a plausible field estimate. Recheck them.");
  return liters;
}
