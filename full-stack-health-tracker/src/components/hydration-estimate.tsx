"use client";

import { useState } from "react";
import { estimateHydration, type HydrationEstimate, type HydrationInputs } from "@/lib/hydration/estimate";
import type { Profile } from "@/lib/types";
import { Button, Field, SectionHeading } from "./ui";

const safetyQuestions = [
  ["fluidRestriction", "Has a clinician restricted your fluids?"],
  ["fluidBalanceCondition", "Do you have a kidney, heart, liver or other condition affecting fluid balance?"],
  ["pregnantOrBreastfeeding", "Are you pregnant, postpartum or breastfeeding?"],
  ["fluidAffectingMedication", "Do you take medication that affects fluid balance (such as diuretics)?"],
] as const;
const answer = (value: FormDataEntryValue | null): boolean | null => value === "yes" ? true : value === "no" ? false : null;
const optionalNumber = (value: FormDataEntryValue | null) => value === null || value === "" ? null : Number(value);

export default function HydrationEstimatePanel({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<HydrationEstimate | null>(null);
  const [error, setError] = useState("");
  function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const safety = Object.fromEntries(safetyQuestions.map(([key]) => [key, answer(data.get(key))])) as HydrationInputs["safety"];
    try {
      setResult(estimateHydration({
        age: user.age, weightKg: user.currentWeight, safety,
        clinicianFluidMl: optionalNumber(data.get("clinicianFluidMl")), otherBeveragesMl: optionalNumber(data.get("otherBeveragesMl")),
        workEnvironment: String(data.get("workEnvironment") || ""), activity: data.get("activity") as HydrationInputs["activity"],
        heat: data.get("heat") as HydrationInputs["heat"], outdoorHours: Number(data.get("outdoorHours")),
        sweating: data.get("sweating") as HydrationInputs["sweating"], exerciseMinutes: Number(data.get("exerciseMinutes")),
      }));
      setError("");
    } catch { setResult(null); setError("Please check the values you entered. A clinician-provided amount must be greater than zero."); }
  }
  return <section className="panel hydration-estimate" aria-label="Personal hydration guidance">
    <SectionHeading title="Personal hydration guidance" subtitle="Optional draft screening reference. Not medical advice or a verified personal requirement." />
    <Button type="button" variant="secondary" aria-expanded={open} aria-controls="hydration-estimate-form" onClick={() => setOpen(!open)}>{open ? "Close guidance" : "Explore hydration guidance"}</Button>
    {open && <form id="hydration-estimate-form" onSubmit={calculate} onChange={() => { setResult(null); setError(""); }}>
      <p>Uses your saved age ({user.age}) and current weight ({user.currentWeight} kg). Your answers and results stay on this screen and are not saved. Your existing target and water history will not change.</p>
      <p><strong>Safety first:</strong> If unsure, select “Unsure”. Your clinician’s advice or fluid restriction always takes priority. Do not force fluids or drink large amounts quickly.</p>
      <div className="form-grid">{safetyQuestions.map(([key, label]) => <Field key={key} label={label}><select name={key} defaultValue="" required><option value="" disabled>Choose an answer</option><option value="yes">Yes</option><option value="no">No</option><option value="unsure">Unsure</option></select></Field>)}</div>
      <div className="form-grid">
        <Field label="Work setting"><select name="workEnvironment" defaultValue="" required><option value="" disabled>Choose a setting</option><option value="Indoor office / air conditioning">Indoor office / air conditioning</option><option value="Indoor active work">Indoor active work</option><option value="Outdoor work">Outdoor work</option><option value="Mixed indoor and outdoor">Mixed indoor and outdoor</option><option value="Other / variable">Other / variable</option></select></Field>
        <Field label="Usual daily activity"><select name="activity" defaultValue="" required><option value="" disabled>Choose activity</option><option value="sedentary">Mostly seated</option><option value="light">Light activity</option><option value="moderate">Moderate activity</option><option value="very">Very active</option><option value="heavy">Heavy physical work</option></select></Field>
        <Field label="Typical heat exposure"><select name="heat" defaultValue="" required><option value="" disabled>Choose conditions</option><option value="cool">Cool / air-conditioned</option><option value="moderate">Moderate</option><option value="hot">Hot</option><option value="unknown">Unsure / varies</option></select></Field>
        <Field label="Typical sweating"><select name="sweating" defaultValue="" required><option value="" disabled>Choose an answer</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="heavy">Heavy</option><option value="unknown">Unsure / varies</option></select></Field>
        <Field label="Hours outdoors per day" hint="Use 0 if none."><input name="outdoorHours" type="number" min="0" max="24" step="0.5" required /></Field>
        <Field label="Exercise minutes per day" hint="Use 0 if none."><input name="exerciseMinutes" type="number" min="0" max="1440" step="1" required /></Field>
        <Field label="Clinician-provided daily amount for all drinks, ml (optional)" hint="Enter only an amount given specifically to you, including all beverages."><input name="clinicianFluidMl" type="number" min="1" max="10000" step="1" /></Field>
        <Field label="Estimated water in other drinks per day, ml (optional)" hint="Exclude plain water. An estimate may be inaccurate."><input name="otherBeveragesMl" type="number" min="0" max="10000" step="1" /></Field>
      </div>
      <Button type="submit">Review guidance</Button>
      {error && <p role="alert">{error}</p>}
      {result && <div className="hydration-estimate-result" role="status">
        {result.status === "safety-answers-needed" && <p><strong>More information needed:</strong> If you are unsure about a safety answer, consult a clinician before using an automatic estimate.</p>}
        {result.status === "clinician-guidance" && <p><strong>Individual clinical guidance needed.</strong> No automatic amount is suggested.</p>}
        {result.beverageRange && <p><strong>{result.status === "clinician-target" ? "Your clinician-provided amount" : "Draft starting range for all beverages"}: {result.beverageRange.minMl.toLocaleString()}{result.beverageRange.minMl !== result.beverageRange.maxMl ? `–${result.beverageRange.maxMl.toLocaleString()}` : ""} ml per day.</strong> This includes water and other drinks, not food.</p>}
        {result.plainWaterRange && <p>After subtracting your estimate for other drinks, the illustrative plain-water amount is {result.plainWaterRange.minMl.toLocaleString()}–{result.plainWaterRange.maxMl.toLocaleString()} ml per day. This is not an instruction to force fluids.</p>}
        {result.explanations.map(text => <p key={text}>{text}</p>)}
        {result.warnings.map(text => <p key={text}>{text}</p>)}
        <p>Height alone is not used to calculate a water target. Work and heat can affect losses, but no unsupported numerical increase is added. This prototype extrapolates an inpatient oral-fluid policy and has not been clinically validated for this app. For outdoor heat work, seek individualized guidance.</p>
        <p>Sources: <a href="https://doclibrary-rcht.cornwall.nhs.uk/GET/d10368900" target="_blank" rel="noreferrer">Royal Cornwall Hospitals adult hydration policy</a> · <a href="https://stacks.cdc.gov/view/cdc/45851" target="_blank" rel="noreferrer">CDC/NIOSH occupational heat guidance</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/17277604/" target="_blank" rel="noreferrer">ACSM exercise and fluid replacement</a></p>
      </div>}
    </form>}
  </section>;
}
