"use client";
import { useState } from "react";
import { EXERCISE_GUIDE_DRAFT, screenExerciseGuide, type SafetyScreen, type ScreenAnswer } from "@/lib/exercise-guide-draft";
import type { Profile } from "@/lib/types";
import { Button, Field, SectionHeading } from "./ui";

const questions: { key: keyof SafetyScreen; label: string }[] = [
  { key: "urgentSymptoms", label: "Chest pain, fainting or severe unexplained breathlessness during activity?" },
  { key: "medicalRestriction", label: "Medical restriction, recent surgery or clinician-advised exercise restriction?" },
  { key: "injuryOrMobility", label: "Serious injury, pain during movement or significant mobility limitation?" },
  { key: "pregnancyPostpartum", label: "Pregnant or postpartum?" },
];
const initial: SafetyScreen = { urgentSymptoms: "", medicalRestriction: "", injuryOrMobility: "", pregnancyPostpartum: "" };

/** Read-only educational reference. No workout generation, health clearance,
 * persistence or unreviewed external video playback. */
export default function ExerciseReference({ user }: { user: Profile }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<SafetyScreen>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState("");
  const status = submitted ? screenExerciseGuide(user.age, answers) : null;
  const term = search.trim().toLowerCase();
  const visible = EXERCISE_GUIDE_DRAFT.filter(item => `${item.name} ${item.primaryMuscles} ${item.purpose} ${item.equipment}`.toLowerCase().includes(term));
  return <section className="panel exercise-reference" aria-label="Exercise library">
    <SectionHeading title="Exercise library" subtitle="36 movement descriptions to explore, not a personalized workout plan." />
    <p><strong>Educational reference only:</strong> These descriptions have not been professionally reviewed and cannot determine which exercises, equipment, sets, reps or loads are safe for you. Ask a qualified exercise professional to check suitability and technique before trying a movement. Do not exercise through pain.</p>
    <p>Reviewed exercise videos are not yet available. This library does not change your existing workouts, meals or profile.</p>
    <Button type="button" variant="secondary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Close exercise library" : "Open exercise library"}</Button>
    {open && <div className="exercise-reference-content"><p>Your saved age is {user.age}. Answer these questions before opening the library. Your answers stay on this device and are not saved or sent to an AI provider. A negative screen is not medical clearance.</p>
      <div className="form-grid">{questions.map(({key,label}) => <Field key={key} label={label}><select value={answers[key]} onChange={event => { setAnswers({...answers,[key]:event.target.value as ScreenAnswer}); setSubmitted(false); }}><option value="">Choose an answer</option><option value="no">No</option><option value="yes">Yes</option><option value="unsure">Unsure</option></select></Field>)}</div>
      <Button type="button" onClick={() => setSubmitted(true)}>Check answers</Button>
      {status === "urgent" && <p role="alert"><strong>Stop exercising and seek urgent medical help.</strong> Chest pain, fainting or severe unexplained breathlessness during activity needs urgent assessment.</p>}
      {status === "incomplete" && <p role="status">Please answer every question. If you are unsure, speak with a qualified healthcare professional before starting a new routine.</p>}
      {status === "clinician" && <p role="status">This reference cannot determine what is appropriate for you. Ask a qualified healthcare professional for advice on safe movement. This does not mean you cannot exercise.</p>}
      {status === "review-only" && <div className="exercise-reference-list"><p>General descriptions only; not individual recommendations or clearance. Stop for pain, dizziness or discomfort. Ask a qualified professional to review the movement and equipment for you.</p>
        <Field label="Search the exercise library" hint="Search by movement, muscle or equipment."><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="For example, chair or shoulders" /></Field>
        <p role="status">Showing {visible.length} of {EXERCISE_GUIDE_DRAFT.length} descriptions.{visible.length === 0 && " Try another search."}</p>
        {visible.map(exercise => <details key={exercise.id} className="exercise-reference-card"><summary>{exercise.name}</summary><div><p><strong>Purpose:</strong> {exercise.purpose}</p><p><strong>Main muscles:</strong> {exercise.primaryMuscles}</p><p><strong>Equipment:</strong> {exercise.equipment}</p><h3>Steps</h3><ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>Breathing:</strong> {exercise.breathing}</p><p><strong>Common mistakes:</strong> {exercise.commonMistakes.join("; ")}.</p><p><strong>Safety:</strong> {exercise.safety}</p><p><strong>Easier:</strong> {exercise.easier}</p><p><strong>Harder:</strong> {exercise.harder}</p><p><strong>Video:</strong> A reviewed exercise-specific video is not yet available.</p></div></details>)}
      </div>}
    </div>}
  </section>;
}
