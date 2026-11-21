"use client";

import { useState } from "react";
import { assessBody, type Applicability, type PopulationReference } from "@/lib/body-assessment";
import type { Profile } from "@/lib/types";
import { Button, Field, SectionHeading } from "./ui";

const categoryLabels = {
  underweight: "Below the standard BMI reference range",
  "reference-range": "Within the standard BMI reference range",
  overweight: "Above the standard BMI reference range (overweight category)",
  "obesity-category": "Above the standard BMI reference range (obesity category)",
} as const;
const actionLabels = {
  "below-23": "Below 23",
  "23-to-below-27.5": "23 to below 27.5",
  "27.5-or-above": "27.5 or above",
} as const;

type ReferenceChoice = "unspecified" | "south-asian" | "east-asian" | "southeast-asian" | "other";
const referenceFor = (value: ReferenceChoice): PopulationReference => value.endsWith("-asian") ? "asian" : value === "other" ? "other" : "unspecified";

export default function BodyAssessment({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState<ReferenceChoice>("unspecified");
  const [context, setContext] = useState<Applicability | "">("");
  const [show, setShow] = useState(false);
  let assessment: ReturnType<typeof assessBody> | null = null;
  let invalid = false;
  if (show && context) {
    try {
      assessment = assessBody({ age: user.age, heightCm: user.height, weightKg: user.currentWeight, populationReference: referenceFor(reference), applicability: context });
    } catch {
      invalid = true;
    }
  }
  const goalDifference = Math.abs(user.currentWeight - user.targetWeight);
  return <section className="panel body-assessment" aria-label="My Body Assessment">
    <SectionHeading title="My Body Assessment" subtitle="An optional screening reference—not a diagnosis, ideal weight, or exercise clearance." />
    <Button type="button" variant="secondary" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="body-assessment-content">{open ? "Close assessment" : "Explore my assessment"}</Button>
    {open && <div id="body-assessment-content" className="body-assessment-content">
      <p>Uses your saved profile: age {user.age}, height {user.height} cm and current weight {user.currentWeight} kg. Unsaved profile edits are not included. Your selections and results are not saved.</p>
      {user.age < 20 ? <p role="status">Adult BMI categories and reference weights are not shown below age 20. Age-appropriate growth references and a qualified health professional can provide context.</p> : <>
        <div className="form-grid">
          <Field label="Population reference (optional)" hint="Choose only if you wish. Location does not determine ancestry."><select value={reference} onChange={event => { setReference(event.target.value as ReferenceChoice); setShow(false); }}><option value="unspecified">Prefer not to specify</option><option value="south-asian">South Asian</option><option value="east-asian">East Asian</option><option value="southeast-asian">Southeast Asian</option><option value="other">European / other</option></select></Field>
          <Field label="Does a standard adult BMI reference apply?" hint="Pregnancy, postpartum and some clinical circumstances can affect interpretation. If unsure, select unsure."><select value={context} onChange={event => { setContext(event.target.value as Applicability | ""); setShow(false); }}><option value="">Please choose</option><option value="standard">I am not pregnant or postpartum and believe it applies</option><option value="pregnant-or-postpartum">Pregnant or postpartum</option><option value="unsure">Unsure or another clinical context</option></select></Field>
        </div>
        <Button type="button" disabled={!context} onClick={() => setShow(true)}>View screening reference</Button>
        {invalid && <p role="alert">Your saved profile values cannot be assessed. Please review them in your health profile.</p>}
        {assessment?.status === "clinical-context-needed" && <p role="status">A standard BMI reference may not be appropriate in this context. Please discuss your measurements and goals with a qualified healthcare professional.</p>}
        {assessment?.status === "screening" && assessment.category && assessment.referenceWeightKg && <div className="body-assessment-results" aria-live="polite">
          <dl>
            <div><dt>Current weight</dt><dd>{user.currentWeight} kg</dd></div><div><dt>Height</dt><dd>{user.height} cm</dd></div>
            <div><dt>BMI</dt><dd>{assessment.bmi}</dd></div><div><dt>Standard category</dt><dd>{categoryLabels[assessment.category]}</dd></div>
            <div><dt>Approximate reference weight range</dt><dd>{assessment.referenceWeightKg.min}–{assessment.referenceWeightKg.max} kg</dd></div>
            <div><dt>Saved goal</dt><dd>{user.fitnessGoal.replace(/-/g, " ")}</dd></div>
            <div><dt>Saved target weight</dt><dd>{user.targetWeight} kg ({goalDifference.toFixed(1)} kg {user.targetWeight > user.currentWeight ? "above current weight" : user.targetWeight < user.currentWeight ? "below current weight" : "from current weight"})</dd></div>
          </dl>
          {assessment.asianActionPoint && <p><strong>Additional Asian population screening action point: {actionLabels[assessment.asianActionPoint]}.</strong> BMI 23 and 27.5 are public-health action points, not diagnoses or a separate ideal-weight formula. Risk varies between individuals.</p>}
          <p>BMI does not measure body fat or distinguish muscle from fat. This population reference range is not a required target; your health and circumstances matter. Categories use the unrounded BMI, so a displayed rounded value may appear on a boundary. Older adults may benefit from focusing on strength, mobility and nutrition rather than a lower weight.</p>
          <p>Discuss interpretation and personal goals with a qualified healthcare professional. This is not medical advice or clearance to exercise.</p>
          <p>Sources: <a href="https://www.cdc.gov/bmi/about/index.html" target="_blank" rel="noreferrer">CDC: About BMI</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/14726171/" target="_blank" rel="noreferrer">WHO expert consultation on Asian populations</a></p>
        </div>}
      </>}
    </div>}
  </section>;
}
