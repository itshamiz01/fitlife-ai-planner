import { EXERCISE_GUIDE_DRAFT } from "./exercise-guide-draft";

/** Search-result candidates, NOT checked by watching the videos, and NOT
 * exercise-professional-approved. They are links only; nothing is embedded. */
export type ExerciseYouTubeCandidate = { exerciseId: string; url: string; title: string; status: "unreviewed" };
export const EXERCISE_YOUTUBE_CANDIDATES: readonly ExerciseYouTubeCandidate[] = [
  { exerciseId: "chair-squat", title: "Chair Squat Demonstration", url: "https://www.youtube.com/watch?v=x1lluFT8iuA", status: "unreviewed" },
  { exerciseId: "wall-push-up", title: "Wall Push-Up Demonstration", url: "https://www.youtube.com/watch?v=Yw9RPfBRjx0", status: "unreviewed" },
  { exerciseId: "glute-bridge", title: "Glute Bridge 101", url: "https://www.youtube.com/watch?v=CPb8yRUxWBQ", status: "unreviewed" },
  { exerciseId: "bird-dog", title: "Bird Dog Exercise for Beginners", url: "https://www.youtube.com/watch?v=LaLKNS7mxrk", status: "unreviewed" },
  { exerciseId: "supported-calf-raise", title: "Heel Raise Exercise to Strengthen Calf Muscles", url: "https://www.youtube.com/watch?v=FRw-Oe7wcSY", status: "unreviewed" },
  { exerciseId: "seated-knee-extension", title: "Seated Knee Extension for Seniors", url: "https://www.youtube.com/watch?v=1Xvrscyh2xI", status: "unreviewed" },
  { exerciseId: "supported-dumbbell-row", title: "Standing One Arm Dumbbell Rows", url: "https://www.youtube.com/watch?v=YT4p79-BxVY", status: "unreviewed" },
  { exerciseId: "standing-hip-hinge", title: "Hip Hinge Exercise Standing Progression", url: "https://www.youtube.com/watch?v=IKWl0vQO3dw", status: "unreviewed" },
  {"exerciseId": "seated-march", "title": "Seated March", "url": "https://www.youtube.com/watch?v=xxf93bq9-vA", "status": "unreviewed"},
  {"exerciseId": "seated-calf-raise", "title": "Seated Calf Raises", "url": "https://www.youtube.com/watch?v=EoYZDrFhj30", "status": "unreviewed"},
  {"exerciseId": "supported-hamstring-curl", "title": "Hamstring Curls (standing, chair support)", "url": "https://www.youtube.com/watch?v=sMyKQ6bgiFM", "status": "unreviewed"},
  {"exerciseId": "supported-hip-abduction", "title": "PhysioCare - Hip Abduction with Chair", "url": "https://www.youtube.com/watch?v=zYCLfFC77hI", "status": "unreviewed"},
  {"exerciseId": "seated-shoulder-blade-squeeze", "title": "Shoulder Blade Squeezes - shoulder exercise", "url": "https://www.youtube.com/watch?v=cjrIx-1I5Xk", "status": "unreviewed"},
  {"exerciseId": "supported-hip-extension", "title": "Hip Extension Standing", "url": "https://www.youtube.com/watch?v=6UxbnQZdgC0", "status": "unreviewed"},
  {"exerciseId": "wall-shoulder-slide", "title": "Body Works Sports Physiotherapy Wall Slides For Shoulder And Upper Back", "url": "https://www.youtube.com/watch?v=uBPwoxG6aVQ", "status": "unreviewed"},
  {"exerciseId": "standing-dumbbell-curl", "title": "Dumbbell Bicep Curl", "url": "https://www.youtube.com/watch?v=TBWfFXZdLy0", "status": "unreviewed"},
  {"exerciseId": "dead-bug", "title": "Modified Dead Bug - Great Abdominal Exercise", "url": "https://www.youtube.com/watch?v=-DZUChWWJM4", "status": "unreviewed"},
  {"exerciseId": "side-lying-clamshell", "title": "Knee - Clamshell", "url": "https://www.youtube.com/watch?v=R98UG81Z25M", "status": "unreviewed"},
  {"exerciseId": "seated-leg-press", "title": "How To Use The Leg Press Machine (Technogym)", "url": "https://www.youtube.com/watch?v=JrMOMoE5dg4", "status": "unreviewed"},
  {"exerciseId": "seated-machine-chest-press", "title": "How to use the seated chest press gym machine", "url": "https://www.youtube.com/watch?v=mDsynSGWaUM", "status": "unreviewed"},
  {"exerciseId": "seated-cable-row", "title": "Seated Cable Row: How to", "url": "https://www.youtube.com/watch?v=oFtfkSElE0s", "status": "unreviewed"},
  {"exerciseId": "lat-pulldown", "title": "Lat Cable Machine Pulldown - NF", "url": "https://www.youtube.com/watch?v=Ptawi5k5X_8", "status": "unreviewed"},
  {"exerciseId": "supported-standing-march", "title": "Standing: March, Lift Knee, Hold, Tap", "url": "https://www.youtube.com/watch?v=VaCCp7MOf7Q", "status": "unreviewed"},
  {"exerciseId": "supported-split-squat", "title": "Chair split squat", "url": "https://www.youtube.com/watch?v=RnUeErXlzRg", "status": "unreviewed"},
  {"exerciseId": "dumbbell-goblet-squat", "title": "Goblet Squat: How To", "url": "https://www.youtube.com/watch?v=3O77G_yiFUw", "status": "unreviewed"},
  {"exerciseId": "dumbbell-romanian-deadlift", "title": "Dumbbell Romanian (RDL) Deadlift |TECHNIQUE for Beginners", "url": "https://www.youtube.com/watch?v=hQgFixeXdZo", "status": "unreviewed"},
  {"exerciseId": "seated-dumbbell-shoulder-press", "title": "How To: Seated Dumbbell Shoulder Press (at home)", "url": "https://www.youtube.com/watch?v=4ERVblKZzHc", "status": "unreviewed"},
  {"exerciseId": "standing-dumbbell-lateral-raise", "title": "How To Do A STANDING DUMBBELL LATERAL RAISE", "url": "https://www.youtube.com/watch?v=U3Atcn3wFjY", "status": "unreviewed"},
  {"exerciseId": "cat-cow", "title": "Cat Cow (Cat Camel) Stretch", "url": "https://www.youtube.com/watch?v=104A9N0njsI", "status": "unreviewed"},
  {"exerciseId": "seated-cat-cow", "title": "Seated Cat Cow", "url": "https://www.youtube.com/watch?v=L9xLH7AYN4w", "status": "unreviewed"},
  {"exerciseId": "single-knee-to-chest", "title": "Supine Knee to Chest One Leg", "url": "https://www.youtube.com/watch?v=qq0rT-5Y0jA", "status": "unreviewed"},
  {"exerciseId": "knee-plank", "title": "How to Do a Knee Plank", "url": "https://www.youtube.com/watch?v=5O9dklzZ1KA", "status": "unreviewed"},
  {"exerciseId": "seated-machine-leg-curl", "title": "Planet Fitness - How To Use Seated Leg Curl Machine", "url": "https://www.youtube.com/watch?v=fK0uZ3KRZRI", "status": "unreviewed"},
  {"exerciseId": "seated-machine-leg-extension", "title": "Planet Fitness - How To Use Leg Extension Machine", "url": "https://www.youtube.com/watch?v=8Jqof7z3QYM", "status": "unreviewed"},
  {"exerciseId": "stationary-bike", "title": "How to Use a Stationary Bike", "url": "https://www.youtube.com/watch?v=z99qyGHnFLI", "status": "unreviewed"},
  {"exerciseId": "elliptical-trainer", "title": "HOW TO USE THE ELLIPTICAL", "url": "https://www.youtube.com/watch?v=sgEC55F4WHQ", "status": "unreviewed"},
];

/** Validates identifiers and link shape, not availability, video content,
 * biomechanical correctness, captions, suitability, or ownership. */
export function validateYouTubeCandidates(candidates: readonly ExerciseYouTubeCandidate[]): string[] {
  const known = new Set(EXERCISE_GUIDE_DRAFT.map(exercise => exercise.id)), seenIds = new Set<string>(), seenUrls = new Set<string>(), errors: string[] = [];
  for (const item of candidates) {
    if (!known.has(item.exerciseId) || seenIds.has(item.exerciseId)) errors.push(`unknown or duplicate exercise: ${item.exerciseId}`);
    seenIds.add(item.exerciseId);
    if (seenUrls.has(item.url)) errors.push(`duplicate video: ${item.exerciseId}`);
    seenUrls.add(item.url);
    if (!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(item.url)) errors.push(`invalid YouTube URL: ${item.exerciseId}`);
    if (!item.title.trim() || item.status !== "unreviewed") errors.push(`missing title or invalid candidate status: ${item.exerciseId}`);
  }
  return errors;
}
export function youtubeCandidate(exerciseId: string, candidates: readonly ExerciseYouTubeCandidate[] = EXERCISE_YOUTUBE_CANDIDATES): ExerciseYouTubeCandidate | null {
  if (validateYouTubeCandidates(candidates).length) return null;
  return candidates.find(item => item.exerciseId === exerciseId) ?? null;
}
