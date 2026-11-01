"use client";
import { useState } from "react";
import { compatibleRecipe, foodById, recipes } from "@/lib/food-catalog";
import { substituteIngredient, substitutionOptions } from "@/lib/ingredient-substitutions";
import { scaleIngredients, dietaryClass, savedServingBase } from "@/lib/recipe-serving";
import { rupees, type MealIngredient, type Profile } from "@/lib/types";

type Props = { recipeId: string | null; ingredients: MealIngredient[]; fallbackInstructions: string; childMode?: boolean; baseLabel?: string; onSaveServings?: (servings: number) => void; saving?: boolean; profile?: Profile; onSubstitute?: (index: number, foodId: string) => void };
export default function RecipeGuide({ recipeId, ingredients, fallbackInstructions, childMode = false, baseLabel = "saved plan portion", onSaveServings, saving = false, profile, onSubstitute }: Props) {
  const [servings, setServings] = useState(ingredients[0]?.servingCount ?? 1);
  const recipe = recipes.find(item => item.id === recipeId);
  const scaled = scaleIngredients(onSaveServings ? savedServingBase(ingredients) : ingredients, servings);
  const allergens = [...new Set(scaled.ingredients.flatMap(item => item.allergens))];
  return <div className="recipe-guide">
    {recipe && <p><strong>{dietaryClass(recipe)}</strong> · {recipe.types.join(" / ")}{recipe.details?.categories.length ? ` · ${recipe.details.categories.join(" / ")}` : ""}</p>}
    {recipe?.details && <><p>{recipe.details.description}</p><p>{recipe.details.preparationMinutes !== null && recipe.details.cookingMinutes !== null ? `Preparation: about ${recipe.details.preparationMinutes} min · Cooking: about ${recipe.details.cookingMinutes} min` : "Preparation and cooking time not specified"} · Reference recipe: 1 serving</p><p>Equipment: {recipe.details.equipment}</p></>}
    {ingredients.length > 0 && <><label className="field"><span>Scale {baseLabel} for cooking{onSaveServings ? "" : " (preview only)"}</span><select value={servings} onChange={event=>setServings(Number(event.target.value))}>{[1,2,3,4].map(n=><option value={n} key={n}>{n} {n===1?"serving":"servings"}</option>)}</select></label><p>{onSaveServings ? "Preview a change, then save it to update this meal and its grocery ingredients. The server rechecks your estimated budget and restrictions; saving resets the enjoyed mark." : "Scaling here is a preview; it does not change the saved plan or grocery list."} Adjust seasoning to taste.</p>{onSaveServings && <button type="button" className="text-link" disabled={saving || servings === (ingredients[0]?.servingCount ?? 1)} onClick={() => onSaveServings(servings)}>{saving ? "Saving…" : "Save servings to this meal"}</button>}
      {!childMode && <div className="nutrition-grid">{[[scaled.calories,"kcal","Energy"],[scaled.protein,"g","Protein"],[scaled.carbs,"g","Carbs"],[scaled.fat,"g","Fat"]].map(([value,unit,label])=><div key={label}><strong>{value}<small> {unit}</small></strong><span>{label} · est.</span></div>)}</div>}
      <p>Estimated ingredient cost: <strong>{rupees(scaled.costPaise,2)}</strong>. Fiber is not available for this catalog.</p><div className="table-scroll"><table><thead><tr><th>Ingredient and preparation state</th><th>Quantity</th><th>Estimated cost</th></tr></thead><tbody>{scaled.ingredients.map((item,index)=><tr key={`${item.foodId}-${index}`}><td><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.name}</a><small> · {item.state}</small></td><td>{item.grams} g</td><td>{rupees(item.costPaise,2)}</td></tr>)}</tbody></table></div><p>Listed allergens: {allergens.length ? allergens.join(", ") : "none of the catalog's labeled allergens"}. Check every label and cross-contact; this is not a medical safety guarantee.</p></>}
    {onSubstitute && profile && <section><h3>Ingredient substitutions</h3><p>Options use the same raw edible weight, not equivalent taste or nutrition. The original instructions do not change: adapt cooking yourself, check labels and cross-contact, and review the new total. A saved substitution resets the enjoyed mark.</p>{ingredients.flatMap((item,index) => substitutionOptions(ingredients,index).flatMap(foodId => {
      const candidate = substituteIngredient(ingredients,index,foodId);
      const safe = compatibleRecipe({ id: recipeId || "", name: "", types: [], ingredients: candidate.ingredients.map(food => [food.foodId,food.grams]), instructions: "", image: "", tag: "" },profile);
      return safe ? [<p key={`${index}-${foodId}`}><button type="button" className="text-link" disabled={saving} onClick={() => onSubstitute(index,foodId)}>Replace {item.name} with {foodById[foodId].name} · {rupees(candidate.costPaise,2)} total est.</button></p>] : [];
    }))}</section>}
    {recipe && ingredients.some(item => !recipe.ingredients.some(([id]) => id === item.foodId)) && <p><strong>Modified ingredients:</strong> The saved ingredient list differs from the original recipe. The instructions below may no longer match; review and adjust preparation yourself.</p>}
    <h3>Cooking instructions</h3>{recipe?.details ? <><p>Instructions describe the reference recipe. Use the quantities above for this {baseLabel}; scale any mentioned water as needed.</p><ol>{recipe.details.steps.map((step,index)=><li key={index}>{step}</li>)}</ol><p>{recipe.details.seasoning}</p><h3>Storage</h3><p>{recipe.details.storage}</p></> : <p>{fallbackInstructions || recipe?.instructions || "No detailed guide is available for this manual entry."}</p>}
  </div>;
}
