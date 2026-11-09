import type { CoachSource, DashboardData, Profile } from "./types";
import { dailyBudget, dietLabels, goalLabels, rupees, todayKey, todayIndex, dayNames } from "./types";
import { foods, foodById, FOOD_REFERENCE, USDA_REFERENCE, parseAllergies } from "./food-catalog";
import { buildMealPlan, buildWorkoutPlan, getBudgetInfo } from "./planner";

export const coachIntents = ["safety","privacy","budget","allergies","meals","workout","progress","water","nutrition","exercise","goals","help","unknown"] as const;
export type CoachIntent = typeof coachIntents[number];
export type CoachAnswer = { content: string; sources: CoachSource[]; intent: CoachIntent };
const profileSource: CoachSource = {title:"Your saved profile",url:"/?view=profile"};
const mealSource: CoachSource = {title:"Your current meal plan",url:"/?view=meals"};
const nutritionSource: CoachSource = {title:"Food-state reference table (USDA-based)",url:FOOD_REFERENCE};
const whoSource: CoachSource = {title:"WHO physical activity guidance",url:"https://www.who.int/europe/publications/i/item/9789240014886"};
const formSource: CoachSource = {title:"NHS strength exercise guidance",url:"https://www.nhs.uk/live-well/exercise/strength-exercises/"};
export function localCoachIntent(message: string): CoachIntent {
  const q=message.toLowerCase();
  if (/api.?key|system prompt|other users|everyone.?s (data|password)|bypass|ignore (all|previous|your) (instructions|rules)/.test(q)) return "privacy";
  if (/chest pain|faint|dizz|shortness of breath|injur|\bpain\b|pregnan|diabet|kidney|heart disease|heart failure|eating disorder|anorexia|bulimia|insulin|medication|diagnos|prescrib|\bcure\b|gout|liver disease|fluid restrict|starv|crash diet|steroid|fat burner/.test(q)) return "safety";
  if (/allerg|cross.contact|gluten.free|peanut.free|without peanuts/.test(q)) return "allergies";
  if (/budget|afford|rupee|₹|\brs\.?\b|\binr\b|cheap|low.cost|\bcost\b|price|money|expensive|sasta|paisa/.test(q)) return "budget";
  if (/form|technique|perform|how (do|to).*(squat|push.?up|plank|bridge|row|bird.dog)/.test(q)) return "exercise";
  if (/summari|progress|this week|last week|last (7|seven) days|history|personal best|\bpr\b|stall|plateau|strength record/.test(q)) return "progress";
  if (/water|hydrat|drink|remind|alarm/.test(q)) return "water";
  if (/workout|exercise|training|gym|minutes|\d+\s*min|sets|reps|muscle routine/.test(q)) return "workout";
  if (/calori|macro|how much protein|protein in|nutrition in|100\s*g|\d+\s*grams/.test(q)) return "nutrition";
  if (/meal|diet|vegetarian|vegan|eggetarian|breakfast|lunch|dinner|snack|what.*eat|food/.test(q)) return "meals";
  if (/my profile|my goal|my age|my height|my weight|lose weight|gain weight|muscle|strength|fat loss/.test(q)) return "goals";
  if (/^(hi|hello|hey|namaste|help)[!.\s]*$|what can you|how.*(app|use|work)|sync|install|sign.in|log.in/.test(q)) return "help";
  return "unknown";
}
export function requestedBudget(message: string): { paise: number; weekly: boolean } | null {
  const match=message.match(/(?:₹|\brs\.?\s*|\binr\s*)(\d+(?:\.\d{1,2})?)/i) || message.match(/(?:budget(?: of| is)?|under|within|afford)\s*(\d+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  const amount=Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return null;
  return {paise:Math.round(amount*100),weekly:/week|weekly|\/wk/i.test(message)};
}
function preferenceIn(message: string) {
  if (/vegan|plant.based/i.test(message)) return "vegan";
  if (/eggetarian|eggitarian|egg.based/i.test(message)) return "eggetarian";
  if (/non[- ]?veg|nonvegetarian/i.test(message)) return "nonvegetarian";
  if (/vegetarian|\bveg\b/i.test(message)) return "vegetarian";
  return null;
}
function mealTypesForQuestion(message: string) { return ["Breakfast","Lunch","Dinner","Snack"].find(type=>new RegExp(`\\b${type}\\b`,"i").test(message)); }
function exerciseAnswer(message: string) {
  if (/squat/i.test(message)) return "Chair squat: place a sturdy chair behind you, stand with feet comfortably apart, brace gently, send your hips back and bend your knees towards the chair. Keep knees following the direction of your toes. Stand through your whole foot without bouncing. Use support if needed and stop with pain.";
  if (/push.?up/i.test(message)) return "Wall push-up: place your hands against a stable wall around shoulder height, step back to a comfortable distance, keep your body in a straight line, bend your elbows to move towards the wall, then press away. Use a closer stance to make it easier. Do not force painful shoulder or wrist positions.";
  if (/bridge/i.test(message)) return "Glute bridge: lie on your back with knees bent and feet flat, gently brace, squeeze your glutes and lift your hips only as far as comfortable without arching your lower back. Lower slowly. Breathe throughout and stop with pain.";
  if (/plank/i.test(message)) return "Supported plank: start against a stable wall or counter, keeping a comfortable straight line from head to heels. Breathe without holding your breath. Short, controlled holds are more useful than forcing a long hold with sagging or painful positions.";
  if (/bird.dog/i.test(message)) return "Bird-dog: start on hands and knees on a stable surface. Gently brace and slide or extend one leg, adding the opposite arm only if balanced. Keep your trunk quiet and return slowly. Use a smaller range if necessary and stop if uncomfortable.";
  if (/row/i.test(message)) return "Supported dumbbell row: support yourself on a stable bench or surface, keep a comfortable neutral spine, and draw a light dumbbell towards your hip without twisting or shrugging. Lower under control. A trainer should check your setup and load in person.";
  return "Which exercise would you like to understand? My reviewed local cues cover chair squats, wall push-ups, glute bridges, supported planks, bird-dogs and supported rows. I can’t assess your form remotely or invent a technique guide for an exercise outside that set.";
}
export function answerFromRecords(message: string, data: DashboardData, previousQuestion = "", routedIntent?: CoachIntent): CoachAnswer {
  const q=message.toLowerCase();
  const p=data.user;
  const sources: CoachSource[]=[profileSource];
  const local=localCoachIntent(message);
  let intent=local;
  if (intent === "unknown" && /^(why|how|tell me more|explain more|what about that)[?!.\s]*$/i.test(message.trim()) && previousQuestion) intent=localCoachIntent(previousQuestion);
  if (intent === "unknown" && routedIntent && coachIntents.includes(routedIntent)) intent=routedIntent;
  const respond=(content:string,extra:CoachSource[]=[]) => ({content,sources:[...sources,...extra],intent});
  if (intent === "privacy") return respond("I only use the account attached to this signed-in session. I can’t retrieve another user’s records, passwords, provider keys or hidden instructions. Tell me what you’d like to understand about your own food budget, plan or saved progress.");
  if (intent === "safety") {
    const urgent=/chest pain|faint|severe.*breath|can.?t breathe/.test(q);
    return respond(`${urgent ? "Stop exercising and seek urgent medical help now for chest pain, fainting or severe trouble breathing. Contact your local emergency service rather than relying on this chat.\n\n" : "I can’t diagnose symptoms, prescribe treatment, or safely adapt a medical diet or injury-rehabilitation plan from chat.\n\n"}Your saved profile says age ${p.age}, ${goalLabels[p.goal]?.toLowerCase() || p.goal}, and ${p.workoutMinutes} minutes available. Those details are not enough to assess medical risk. Avoid pushing through pain or changing prescribed fluids, medicines or food restrictions. Speak with a qualified clinician or dietitian; a trainer can help with comfortable exercise technique once you are cleared. I can still explain how to record symptoms as notes or review non-medical parts of the app.`,[{title:"NHS chest-pain safety information",url:"https://www.nhs.uk/conditions/chest-pain/"}]);
  }
  if (intent === "allergies") {
    const parsed=parseAllergies(p.allergies);
    return respond(`Your saved ingredient exclusions are: ${p.allergies || "none entered"}.\n\n${parsed.unknown.length ? `I can’t verify these notes: ${parsed.unknown.join(", ")}. Automatic generation is blocked until they are clarified.` : "Generated recipes are filtered against the catalog’s listed ingredient IDs and allergen tags. This is not a guarantee of allergy safety."}\n\nPackage labels, substitutions and cross-contact are not verified. Don’t test an allergen by eating a little. If your allergy has changed, update My health profile before using a new plan; mentioning it in chat does not silently change the saved profile. Seek professional guidance for serious allergies.`,[mealSource,{title:"Food allergy guidance",url:"https://www.nhs.uk/conditions/food-allergy/"}]);
  }
  const namedDay=dayNames.findIndex(name=>new RegExp(`\\b${name}\\b`,"i").test(message));
  const recordDay=namedDay>=0?namedDay:/\byesterday\b/.test(q)?(todayIndex()+6)%7:todayIndex();
  const dayMeals=data.meals.filter(meal=>meal.day===recordDay);
  const recordedFood=/what (?:did|have) i (?:eat|eaten)|calori.*(?:eaten|logged|consumed)|protein intake|macros.*(?:today|logged)|meals?.*(?:marked|enjoyed|eaten)/.test(q);
  const savedMenu=/(?:my|saved|current)\s+(?:(?:saved|current)\s+)?(?:meal\s+)?(?:plan|menu)/.test(q);
  const savedPrice=intent==="budget"&&/cost|price/.test(q)&&/^(?:what|how much)/.test(q)&&/\bmy\b|saved|planned/.test(q);
  if (recordedFood || (intent!=="workout"&&savedMenu&&!/\b(create|suggest|make|new)\b/.test(q)) || savedPrice) {
    const type=mealTypesForQuestion(message);
    const selected=dayMeals.filter(meal=>(!recordedFood||meal.completed)&&(!savedPrice||!type||meal.mealType===type));
    const knownCost=selected.reduce((sum,meal)=>sum+(meal.costPaise??0),0);
    const uncertain=selected.some(meal=>meal.costPaise===null);
    const calories=selected.reduce((sum,meal)=>sum+meal.calories,0);
    const protein=selected.reduce((sum,meal)=>sum+meal.protein,0);
    return respond(`${recordedFood?"Current-plan meals marked enjoyed":"Your actual saved menu"} for the plan’s ${dayNames[recordDay]} slot:\n${selected.length?selected.map(meal=>`• ${meal.mealType}: ${meal.name}${p.age>=18?` — ${meal.calories} kcal, ${meal.protein} g protein estimated`:""}; ${meal.costPaise===null?"cost not entered":`${rupees(meal.costPaise,2)} estimated`}`).join("\n"):"No matching meal/checkmark is saved for this plan slot."}\n\n${p.age>=18?`Reference/manual total for these entries: ${calories} kcal and ${protein} g protein. `:""}Known ingredient/entered cost: ${rupees(knownCost,2)}${uncertain?"; unpriced entries add an unknown amount, not zero":""}.\n\nThese are saved plan entries and checkmarks, not a timestamped consumption diary or proof you ate the listed quantity. Manual entries are user estimates; photos and chat suggestions are not evidence of what you consumed. I have not replaced this menu or filled gaps with generated records.`,[mealSource]);
  }
  if (intent==="workout"&&/complete|finished|logged|done|did i/.test(q)) {
    const selected=data.workouts.filter(workout=>workout.day===recordDay);
    const completed=selected.filter(workout=>workout.completed);
    return respond(`For the current plan’s ${dayNames[recordDay]} slot, ${completed.length} of ${selected.length} activities are marked complete.\n${completed.map(workout=>`• ${workout.name}: ${workout.duration} prescribed minutes`).join("\n")||"No activity has a completion checkmark."}\n\nThese are plan checkmarks, not measured exercise duration or dated set-by-set training records. I can’t infer actual weights, reps or a personal record from them.`,[{title:"Your saved workout plan",url:"/?view=workouts"}]);
  }
  const mentionedFoods=foods.filter(food => food.aliases.some(alias => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(message)));
  const mentionedFood=mentionedFoods[0];
  const quantity=message.match(/(\d+(?:\.\d+)?)\s*(kg|g|grams?)\b/i);
  if (intent === "budget" && /where.*(buy|shop)|live.*price|price.*(today|now)|current.*price/.test(q)) return respond("I don't have live shop prices, seller availability or your location. The planner uses explicitly labelled sample ingredient prices. Check local shops and package quantities; I can compare catalog estimates, but I won’t invent a current offer or seller.", [mealSource]);
  if (intent === "budget" && mentionedFoods.length >= 2 && /cheap|compare|versus|\bvs\b|cost|price/.test(q)) return respond(`At the catalog’s sample prices, per 100 g edible/reference weight:\n${mentionedFoods.map(food=>`• ${food.name} (${food.state}): ${rupees(food.price,2)}; ${food.protein} g reference protein`).join("\n")}\n\nThese are not live prices or equivalent servings. Choose according to your saved restrictions and local prices, not price alone.`,[nutritionSource,mealSource]);
  if (intent === "nutrition" && /calculat|source|where.*(number|calori)|estimated/.test(q) && /meal|recipe|nutrition|macro/.test(q)) {
    const meal=data.meals.find(item=>item.ingredients.length);
    const example=meal?.ingredients[0];
    return respond(`Meal nutrition is calculated—not written by a language model. For each ingredient: grams ÷ 100 × its reference kcal/protein/carbohydrate/fat per 100 g. We add the ingredients and round the totals. Dry/raw and cooked food states must not be mixed.\n\n${example?`For example, your ${meal.name} includes ${example.grams} g ${example.name.toLowerCase()} (${example.state}), contributing about ${example.kcal} kcal in that reference calculation. The full meal totals ${meal.calories} kcal and ${meal.protein} g protein.`:"You don't currently have an ingredient-calculated recipe to demonstrate. Manual entries remain labelled as user estimates."}\n\nPublished calories may not equal 4×protein + 4×carbs + 9×fat because food-specific factors and fibre differ. Brands, cooking losses and portions add uncertainty. This is not lab-tested nutrition or a guarantee of individual adequacy.`,[nutritionSource,mealSource]);
  }
  if (intent === "nutrition" && /protein.*(need|should|target)|^how much protein[?!.\s]*$/.test(q)) {
    if (p.age<18) return respond("For children and teens I don’t calculate a bodybuilding protein prescription. A caregiver and pediatric dietitian should guide growth, food variety and any sports-specific needs.",[nutritionSource]);
    const protein=data.meals.filter(item=>item.day===todayIndex()).reduce((sum,item)=>sum+item.protein,0);
    return respond(`Your current day’s planned meals add up to an estimated ${protein} g protein; that is planned food, not verified intake.\n\nFor generally healthy exercising adults, an ISSN review discusses roughly 1.4–2.0 g/kg/day. At your saved ${p.currentWeight} kg, that arithmetic is about ${Math.round(p.currentWeight*1.4)}–${Math.round(p.currentWeight*2)} g/day. This is a general sports-nutrition reference, not your personal medical prescription. Needs differ; kidney disease, pregnancy, older-age concerns and other conditions require qualified guidance.\n\nAffordable protein options in this catalog include lentils and chana, and eggs or dairy if your preference and allergy settings permit. You don’t need to assume expensive supplements are necessary.`,[{title:"ISSN position stand: protein and exercise",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/"},mealSource]);
  }
  if ((intent === "nutrition" || intent === "budget" && /cost|price/.test(q) && quantity) && mentionedFood) {
    const grams=quantity ? Number(quantity[1])*(quantity[2].toLowerCase()==="kg"?1000:1) : 100;
    if (!(grams>0 && grams<=5000)) return respond("Please give a realistic reference quantity in grams (for example, 100 g). I won’t turn an unclear quantity into a nutrition claim.",[nutritionSource]);
    if (/cooked|boiled|prepared/.test(q) && /dry|raw/.test(mentionedFood.state)) return respond(`You asked about cooked or prepared ${mentionedFood.name.toLowerCase()}. My catalog entry is ${mentionedFood.state}, so I won’t apply its per-100 g value to a cooked serving. Cooking changes water weight. Use the matching cooked-food label/reference, or the dry/raw ingredient weights in your saved recipe. The local catalog’s ${mentionedFood.kcal} kcal per 100 g applies only to its stated reference state.`,[nutritionSource]);
    const value=(amount:number)=>Math.round(amount*grams/10)/10;
    const restricted=parseAllergies(p.allergies).excluded;
    const warning=restricted.includes(mentionedFood.id)||mentionedFood.allergens.some(tag=>restricted.includes(tag));
    if (intent === "budget") return respond(`Using the sample catalog price—not a live local quote—${grams} g of ${mentionedFood.name.toLowerCase()} (${mentionedFood.state}) costs approximately ${rupees(Math.round(mentionedFood.price*grams/100),2)}. Calculation: ${grams} ÷ 100 × ${rupees(mentionedFood.price,2)} per 100 g. Check the price at your shop.${warning ? " This food also matches a saved exclusion, so this is information, not a recommendation to eat it." : ""}`,[{title:"Sample price assumptions",url:"/?view=meals"}]);
    return respond(`${grams} g ${mentionedFood.name.toLowerCase()} — ${mentionedFood.state}:\n• ${value(mentionedFood.kcal)} kcal\n• ${value(mentionedFood.protein)} g protein\n• ${value(mentionedFood.carbs)} g carbohydrate\n• ${value(mentionedFood.fat)} g fat\n\nCalculation: grams ÷ 100 × the catalog’s per-100 g values. These are generic reference estimates, not verified results for your particular product or cooked dish.${warning ? " This food matches a saved exclusion; the calculation is not advice to eat it." : ""}`,[{title:mentionedFood.name+" reference",url:mentionedFood.sourceUrl},nutritionSource]);
  }
  if (intent === "nutrition" && !mentionedFood && (quantity || /\b(in|of)\b/.test(q))) return respond("I don’t have a matching food/state reference for that nutrition question in this catalog, so I won’t invent a calorie or protein number. Please name a catalog food (for example rice, lentils, chickpeas, banana, eggs or milk), provide grams, and say whether the weight is raw/dry or cooked. A packet label or a matching food-composition entry is better for foods not covered here.",[nutritionSource]);
  if (intent === "budget" || intent === "meals") {
    if (/\$|\busd\b|dollar|€|\beur\b|£|pounds/i.test(message)) return respond("The current catalog is priced in Indian rupees. I don’t have a verified live exchange rate and won’t treat dollars, euros or pounds as rupees. Please give an INR daily or weekly amount, or check a current conversion yourself before updating your budget.",[mealSource]);
    if (/\bmonth(?:ly)?\b|\byear(?:ly)?\b/i.test(message)) return respond("Your profile supports daily or weekly INR budgets. Month lengths vary, so I won’t silently treat a monthly amount as a daily one. Please choose the number of days you intend to cover and tell me the resulting daily or weekly amount. Chat does not change your saved budget.",[profileSource]);
    const explicit=requestedBudget(message);
    const inherited=!explicit && /what about|cheaper|instead|same budget/i.test(message) ? requestedBudget(previousQuestion) : null;
    const request=explicit||inherited;
    const diet=preferenceIn(message);
    const simulation: Profile={...p,...(request?{foodBudgetPaise:request.paise,budgetPeriod:request.weekly?"weekly":"daily"}:{}),...(diet?{diet}:{})};
    const info=getBudgetInfo(simulation);
    const counterfactual=Boolean(request||diet);
    const contextLine=`Your saved budget is ${rupees(dailyBudget(p),2)} per day (${rupees(data.planning.weeklyBudgetPaise,2)} per week), with ${dietLabels[p.diet] || p.diet} food preferences and a ${goalLabels[p.goal]?.toLowerCase() || p.goal} goal.`;
    const plan=buildMealPlan(simulation);
    const intro=counterfactual ? `For the ${dietLabels[simulation.diet]} / ${rupees(info.dailyBudgetPaise,2)}-per-day example you asked about (not a saved profile change):` : `Here is a suggested reference menu using your saved ${dietLabels[p.diet]} settings and ${rupees(info.dailyBudgetPaise,2)} daily guide (it may differ from your edited plan and is not saved by this chat):`;
    if (!plan.length) return respond(`${contextLine}\n\n${intro}\n${info.warnings.join("\n\n")}\n\nI won’t pretend a nutritionally suitable full plan exists at that price. Practical lower-cost building blocks include rice, dal, chana and seasonal produce where compatible with your restrictions. Check local prices or pantry foods; for a ₹0 or very limited food budget, consider trusted local community food or ration-support services. I can’t verify their availability.`,[mealSource,nutritionSource]);
    const menu=plan.filter(meal=>meal.day===todayIndex());
    const total=menu.reduce((sum,meal)=>sum+meal.costPaise,0);
    const lines=menu.map(meal=>`• ${meal.mealType}: ${meal.name} — ${rupees(meal.costPaise,2)} estimated${p.age>=18?`, ${meal.calories} kcal`:"; caregiver-guided serving"}`);
    return respond(`${contextLine}\n\n${intro}\n${lines.join("\n")}\n\nIngredient estimate: ${rupees(total,2)}; ${rupees(Math.max(0,info.dailyBudgetPaise-total),2)} below this example’s daily cap.${p.age>=18?` Reference total: ${menu.reduce((sum,meal)=>sum+meal.calories,0)} kcal and ${menu.reduce((sum,meal)=>sum+meal.protein,0)} g protein—not a claim of complete individual nutritional adequacy.`:" Children’s portions need caregiver/professional guidance; I am not setting a calorie limit."}\n\nNo imported fruit or premium ingredient is required. Use Meal planner → Choose a budget swap for alternatives. These are sample prices, excluding extra spices, fuel and delivery; photos are illustrative. ${counterfactual?"Save a changed budget or preference in My health profile to regenerate the actual plan.":"Read the ingredient weights and preparation before cooking."}`,[mealSource,nutritionSource]);
  }
  if (intent === "water") {
    const total=data.waterLogs.filter(log=>log.date===todayKey()).reduce((sum,log)=>sum+log.amount,0);
    return respond(`For the stored date ${todayKey()}, you have logged ${total.toLocaleString()} ml of water against your saved ${p.waterTarget.toLocaleString()} ml daily guide. ${total<p.waterTarget?`${(p.waterTarget-total).toLocaleString()} ml remains relative to that guide.`:"You have reached that estimate; it is not a reason to force more water."}\n\nThirst, food, weather, activity and health affect fluid needs. Do not drink large amounts quickly or override a clinician’s fluid restriction. You can adjust the guide in My health profile.\n\nReminders are ${p.remindersEnabled?`on, every ${p.reminderInterval} minutes`:"currently off"}, between 8 AM and 9 PM local time while Fit Life Bro is open. Installing the app does not enable closed-app reminders by itself. Optional Web Push requires server setup and permission on each device; delivery can be delayed or blocked. Phones can pause open-app timers when locked.`,[{title:"Your dated water logs",url:"/?view=water"}]);
  }
  if (intent === "progress") {
    const date=new Date(); const end=new Date(); const weekDay=(date.getUTCDay()+6)%7;
    if (/this week/.test(q)) date.setUTCDate(date.getUTCDate()-weekDay);
    else if (/last week/.test(q)) {date.setUTCDate(date.getUTCDate()-weekDay-7);end.setUTCDate(end.getUTCDate()-weekDay-1);}
    else date.setUTCDate(date.getUTCDate()-6);
    const since=date.toISOString().slice(0,10); const until=end.toISOString().slice(0,10);
    const weights=data.weightLogs.filter(log=>log.date>=since && log.date<=until).sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt));
    const water=data.waterLogs.filter(log=>log.date>=since && log.date<=until);
    const workouts=data.workouts.filter(workout=>workout.completed);
    const eaten=data.meals.filter(meal=>meal.completed);
    const trend=weights.length>=2?`First-to-latest change within this window: ${(weights[weights.length-1].weight-weights[0].weight).toFixed(1)} kg. That is a change between recorded measurements, not proof of fat or muscle change.`:"There aren’t two measurements in this window, so I can’t calculate a meaningful weight trend.";
    return respond(`Here is what is actually saved, using dated entries from ${since} through ${until}:\n• Weight check-ins: ${weights.length}; ${trend}\n• Water logged: ${water.reduce((sum,log)=>sum+log.amount,0).toLocaleString()} ml across ${new Set(water.map(log=>log.date)).size} recorded days. Missing logs are not proof you drank nothing.\n• Current weekly-plan checkmarks: ${workouts.length} completed activities (${workouts.reduce((sum,item)=>sum+item.duration,0)} prescribed minutes) and ${eaten.length} meals marked enjoyed. Those checkmarks are plan status, not a separate dated strength/meal journal.\n\nI do not have actual set-by-set training loads or personal-best records in this version, and won’t invent them.${/stall|plateau/.test(q)?" A short weight window cannot diagnose a plateau. Compare consistent measurements over time, sleep, recovery, actual intake and adherence; seek a professional review if you’re worried.":""} Body weight alone does not accurately separate fat, muscle and water.`,[{title:"Your weight history",url:"/?view=progress"},{title:"Your water history",url:"/?view=water"},{title:"Current workout plan status",url:"/?view=workouts"}]);
  }
  if (intent === "exercise") return respond(`${exerciseAnswer(message)}\n\nThese are general technique cues, not an assessment of your form. A qualified trainer should check technique and load in person. Stop if you feel pain, dizziness or unusual symptoms.`,[formSource]);
  if (intent === "workout") {
    const match=message.match(/(\d{1,3})\s*(?:-\s*)?min(?:ute)?s?\b/i);
    const minutes=match?Number(match[1]):p.workoutMinutes;
    if (minutes<10) return respond(`If you only have ${Math.max(1,minutes)} minutes, keep it simple: comfortable walking or gentle mobility at your pace, not a rushed heavy session. Any movement counts. Your saved session preference remains ${p.workoutMinutes} minutes; update the profile if that has changed.`,[whoSource]);
    if (p.age<18) return respond(`For your saved age ${p.age}, keep movement enjoyable and caregiver-guided. A ${minutes}-minute opportunity can be a comfortable family walk or active play—not a rushed loaded adult workout. WHO’s general child/teen guidance is an average of 60 minutes of varied daily activity, spread through the day, adapted to ability. I’m not prescribing calorie-burning exercise or automatic load increases.`,[whoSource]);
    const adjusted: Profile={...p,workoutMinutes:Math.min(90,minutes),fitnessGoal:/strength/i.test(message)?"strength":/muscle/i.test(message)?"muscle-gain":p.fitnessGoal};
    const plan=buildWorkoutPlan(adjusted).filter(workout=>workout.day===0);
    return respond(`Based on your saved ${p.experience} level, ${p.equipment} equipment and age ${p.age}, here is a ${adjusted.workoutMinutes}-minute example${match?" for the time you asked about (your saved plan is unchanged)":""}:\n\n${plan.map(workout=>`${workout.name} — ${workout.duration} minutes\n${workout.description}`).join("\n\n")}\n\nUse recovery days between harder sessions; never add load automatically through pain or poor technique. ${p.age<18?"Children need varied caregiver-guided activity, not a weight-loss workout.":"WHO’s general adult guidance is 150–300 minutes of moderate aerobic activity a week plus strengthening on at least 2 days, adapted to your situation—not a command to rush a session."}`, [whoSource,{title:"Your workout plan",url:"/?view=workouts"}]);
  }
  if (intent === "goals" && /my age/.test(q)) return respond(`Your saved age is ${p.age} years. That is a profile entry, not something I inferred. Update My health profile if it is incorrect.`);
  if (intent === "goals" && /my height/.test(q)) return respond(`Your saved height is ${p.height} cm. Update My health profile if it has changed or was entered incorrectly.`);
  if (intent === "goals" && /my weight/.test(q)) return respond(`Your current saved weight is ${p.currentWeight} kg, with a saved target of ${p.targetWeight} kg. Weight entries and daily fluctuations do not by themselves tell me how much is fat, muscle or water.`,[{title:"Your weight history",url:"/?view=progress"}]);
  if (intent === "nutrition" || intent === "goals") return respond(`Your saved profile: ${p.currentWeight} kg currently, ${p.targetWeight} kg target, ${goalLabels[p.goal]?.toLowerCase() || p.goal}; ${dietLabels[p.diet]} meals with ${rupees(dailyBudget(p),2)} per day.\n\n${p.age<18?"I do not set weight-loss calorie targets for children or teens. A caregiver and pediatric clinician should guide growth-related needs.":`Your saved adult energy estimate is ${p.calorieTarget.toLocaleString()} kcal/day. It comes from a resting-energy equation, activity estimate and a modest goal adjustment—not a measured metabolism or medical prescription.`}\n\nMeal nutrition is calculated from explicit ingredient weights and reference values, not invented by the coach. Actual requirements, products and preparation differ. I cannot promise a rate of weight change or diagnose stalled progress. Ask about a particular food and weight (for example, “100 g dry rice”), or ask me to show your budget-friendly menu.`,[nutritionSource]);
  if (intent === "help") return respond(`Hi, I’m Nivra—your source-grounded Fit Life Bro guide. I can use your own saved profile (${goalLabels[p.goal]?.toLowerCase() || p.goal}, ${dietLabels[p.diet]}, ${rupees(dailyBudget(p),2)}/day) to explain affordable meals, recipe quantities, your workout settings, hydration logs and dated weight changes.\n\nTry “What can I eat on my budget?”, “I only have 20 minutes”, “How much water have I logged?”, or “Summarize my progress”.\n\nI don’t silently edit your plan, browse live shop prices, diagnose health problems or access other accounts. There is no paid AI required for this local guide, and no system can guarantee error-free advice. Registered records come from the server; offline edits are not queued. Use Install on my phone in Settings for Android/iPhone home-screen access.`);
  return respond("I don’t have a sufficiently verified answer to that question in the local fitness guide. I’d rather say that than make one up. Could you name the food, exercise, budget or saved record you want help with? I can explain budget-friendly meals, ingredient-based nutrition, basic technique, your planned workouts, water logs and recorded weight trends.");
}
