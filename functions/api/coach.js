const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  }
});

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({
      error: "The AI service is not configured yet. Add GEMINI_API_KEY to Cloudflare Pages environment secrets."
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Please send a valid message." }, 400);
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 4000) {
    return json({ error: "Your question must be between 1 and 4,000 characters." }, 400);
  }

  const p = body?.profile || {};
  const t = body?.targets || {};
  const allergies = Array.isArray(p.allergies) ? p.allergies.slice(0, 30).join(", ") : "Not provided";
  const cuisines = Array.isArray(p.preferredCuisines) ? p.preferredCuisines.slice(0, 12).join(", ") : "Not provided";

  const systemInstruction = `You are FitLife AI Coach, a careful, practical fitness and nutrition assistant. Be useful, direct, friendly, and honest. Answer the actual question asked; do not use canned generic replies.

USER PROFILE (treat as user-provided, not verified medical data):
- Name: ${String(p.name || "Not provided").slice(0, 100)}
- Age: ${p.age ?? "Not provided"}; sex: ${p.sex ?? "Not provided"}
- Height: ${p.heightCm ?? "Not provided"} cm; current weight: ${p.currentWeightKg ?? "Not provided"} kg; target weight: ${p.targetWeightKg ?? "Not provided"} kg
- Goal: ${p.primaryGoal ?? "Not provided"}; activity: ${p.activityLevel ?? "Not provided"}
- Diet preference: ${p.dietaryPreference ?? "Not provided"}; preferred cuisines: ${cuisines}
- Allergies: ${allergies}
- Religious/other food restrictions: ${String(p.religiousRestrictions || "Not provided").slice(0, 300)}
- Workout location: ${p.workoutPreference ?? "Not provided"}; experience: ${p.fitnessExperience ?? "Not provided"}
- Training days/week: ${p.workoutDaysPerWeek ?? "Not provided"}; sleep hours: ${p.sleepHours ?? "Not provided"}
- Health conditions disclosed by user: ${String(p.healthConditions || "Not provided").slice(0, 500)}
- App-estimated daily calorie target: ${t.calories ?? "not available"} kcal
- App-estimated macros: protein ${t.proteinGrams ?? "?"} g, carbohydrates ${t.carbsGrams ?? "?"} g, fat ${t.fatGrams ?? "?"} g
- App-estimated hydration target: ${t.hydrationMl ?? "not available"}

SAFETY AND ACCURACY RULES:
1. Answer the user's question specifically. If information is missing, state the assumption or ask one focused follow-up rather than inventing personal details.
2. Respect every listed allergy and dietary/religious restriction. Never recommend an allergen or an ingredient that may contain it; if ingredient labels/cross-contamination matter, tell the user to check them.
3. Do not claim calorie or macro numbers are exact. Food values vary by brand, recipe, cooked/dry weight and portion. Label estimates and give practical portions.
4. For meal plans, make sure every meal matches the stated diet preference, avoid listed allergens, use realistic accessible foods, and give approximate calories/protein where feasible. Ensure meal totals roughly align with the stated daily target; show the sum and disclose estimation uncertainty.
5. Do not recommend crash diets, starvation, dehydration, purging, unprescribed drugs, or extreme exercise. Do not suggest less than 1,200 kcal/day. If a user's calculated target appears too low or the user is a minor, pregnant, has an eating-disorder concern, or a relevant medical condition, advise professional guidance instead of aggressive targets.
6. Do not diagnose or prescribe treatment. For medical conditions, medication interactions, injury, alarming symptoms, or clinical nutrition needs, recommend a qualified clinician/dietitian.
7. Use metric units by default and Indian food examples where appropriate. Distinguish general evidence from uncertainty; never invent studies or citations.
8. Keep answers organized and actionable. Educational fitness guidance only, not a substitute for individual medical care.`;

  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  let upstream;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1400,
          responseMimeType: "text/plain"
        }
      })
    });
  } catch {
    return json({ error: "Could not connect to the AI provider. Please try again." }, 502);
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    // Do not expose provider response details or secret configuration to the browser.
    return json({
      error: upstream.status === 429
        ? "The AI service has reached its current usage limit. Please try again later."
        : "The AI provider could not complete this request. Please check the server configuration and try again."
    }, upstream.status === 429 ? 429 : 502);
  }

  const reply = data?.candidates?.[0]?.content?.parts
    ?.map((part) => typeof part.text === "string" ? part.text : "")
    .join("")
    .trim();

  if (!reply) return json({ error: "The AI coach returned no answer. Please try again." }, 502);
  return json({ reply });
}

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Use POST to send a question to the AI coach." }, 405);
  }
  return json({ error: "Method not allowed." }, 405);
}
