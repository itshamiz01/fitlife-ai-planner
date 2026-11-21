/** Screening arithmetic only; see docs/BODY_ASSESSMENT_METHODOLOGY.md.
 * Not an exercise clearance, diagnosis, treatment target or body-composition estimate.
 */
export type PopulationReference = "asian" | "other" | "unspecified";
export type Applicability = "standard" | "pregnant-or-postpartum" | "unsure";
export type BodyAssessmentInput = {
  age: number;
  heightCm: number;
  weightKg: number;
  populationReference: PopulationReference;
  applicability: Applicability;
  waistCm?: number | null;
  hipCm?: number | null;
  bodyFatPercent?: number | null;
};
type Category = "underweight" | "reference-range" | "overweight" | "obesity-category";
type AsianAction = "below-23" | "23-to-below-27.5" | "27.5-or-above";
type WaistScreen = "below-0.5" | "0.5-or-above" | "not-interpreted";
export type BodyAssessment = {
  methodVersion: "body-screening-v1-draft";
  status: "screening" | "age-reference-needed" | "clinical-context-needed";
  bmi: number | null;
  category: Category | null;
  referenceWeightKg: { min: number; max: number } | null;
  asianActionPoint: AsianAction | null;
  waistToHeightRatio: number | null;
  waistScreen: WaistScreen | null;
  suppliedMeasurements: { waistCm: number | null; hipCm: number | null; bodyFatPercent: number | null };
};
const finiteBetween = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const optional = (value: unknown, min: number, max: number, label: string): number | null => {
  if (value === null || value === undefined) return null;
  if (!finiteBetween(value, min, max)) throw new RangeError(`Invalid ${label}.`);
  return value;
};
const round = (n: number, places: number) => Number(n.toFixed(places));
export function poundsToKg(pounds: number): number {
  if (!finiteBetween(pounds, 0.01, 1000)) throw new RangeError("Invalid pounds.");
  return pounds * 0.45359237;
}
export function feetInchesToCm(feet: number, inches: number): number {
  if (!Number.isInteger(feet) || !finiteBetween(feet, 0, 8) || !finiteBetween(inches, 0, 11.999999) || feet * 12 + inches === 0) throw new RangeError("Invalid height in feet and inches.");
  return (feet * 12 + inches) * 2.54;
}
export function kgToPounds(kg: number): number {
  if (!finiteBetween(kg, 0.01, 400)) throw new RangeError("Invalid kilograms.");
  return kg / 0.45359237;
}
export function assessBody(input: BodyAssessmentInput): BodyAssessment {
  if (!input || !Number.isInteger(input.age) || !finiteBetween(input.age, 5, 110) || !finiteBetween(input.heightCm, 60, 250) || !finiteBetween(input.weightKg, 12, 400) || !["asian", "other", "unspecified"].includes(input.populationReference) || !["standard", "pregnant-or-postpartum", "unsure"].includes(input.applicability)) throw new RangeError("Invalid body assessment input.");
  const measurements = {
    waistCm: optional(input.waistCm, 20, 300, "waist circumference"),
    hipCm: optional(input.hipCm, 20, 300, "hip circumference"),
    bodyFatPercent: optional(input.bodyFatPercent, 0, 100, "body-fat percentage"),
  };
  const blank: BodyAssessment = { methodVersion: "body-screening-v1-draft", status: "screening", bmi: null, category: null, referenceWeightKg: null, asianActionPoint: null, waistToHeightRatio: null, waistScreen: null, suppliedMeasurements: measurements };
  if (input.age < 20) return { ...blank, status: "age-reference-needed" };
  if (input.applicability !== "standard") return { ...blank, status: "clinical-context-needed" };
  const heightM = input.heightCm / 100;
  const rawBmi = input.weightKg / (heightM * heightM);
  const category: Category = rawBmi < 18.5 ? "underweight" : rawBmi < 25 ? "reference-range" : rawBmi < 30 ? "overweight" : "obesity-category";
  const asianActionPoint: AsianAction | null = input.populationReference !== "asian" ? null : rawBmi < 23 ? "below-23" : rawBmi < 27.5 ? "23-to-below-27.5" : "27.5-or-above";
  const ratio = measurements.waistCm === null ? null : measurements.waistCm / input.heightCm;
  const waistScreen: WaistScreen | null = ratio === null ? null : rawBmi >= 35 ? "not-interpreted" : ratio < 0.5 ? "below-0.5" : "0.5-or-above";
  return { ...blank, bmi: round(rawBmi, 1), category, asianActionPoint, referenceWeightKg: { min: round(18.5 * heightM * heightM, 1), max: round(24.9 * heightM * heightM, 1) }, waistToHeightRatio: ratio === null ? null : round(ratio, 2), waistScreen };
}
