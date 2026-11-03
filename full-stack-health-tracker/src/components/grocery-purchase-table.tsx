"use client";
import { useEffect, useState } from "react";
import { authJson } from "@/lib/auth-client";
import { groceryItemKey } from "@/lib/groceries";
import { rupees, type MealIngredient } from "@/lib/types";

type Props = { signature: string; groups: { label: string; items: MealIngredient[] }[]; total: number };
export default function GroceryPurchaseTable({ signature, groups, total }: Props) {
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void authJson<{ entry: { listSignature: string; purchasedKeys: string[] } | null }>("/api/groceries").then(({ entry }) => {
      if (active) { setPurchased(new Set(entry?.listSignature === signature ? entry.purchasedKeys : [])); setError(""); }
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load grocery marks."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [signature, retry]);
  async function toggle(key: string, checked: boolean) {
    if (saving || loading || error) return;
    const next = new Set(purchased);
    if (checked) next.add(key); else next.delete(key);
    setSaving(true);
    try {
      await authJson("/api/groceries", { method: "PUT", body: JSON.stringify({ listSignature: signature, purchasedKeys: [...next] }) });
      setPurchased(next);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not save grocery marks."); }
    finally { setSaving(false); }
  }
  return <><p>Purchase marks are saved for the most recently edited grocery list. Changing its scope, people, ingredients or amounts starts a new list; marks from the previous list are replaced on the next edit.</p>{error && <p role="alert">{error} <button type="button" onClick={() => { setError(""); setLoading(true); setRetry(value => value + 1); }}>Retry</button></p>}{loading && <p role="status">Loading saved grocery marks…</p>}<div className="table-scroll"><table><thead><tr><th>Purchased</th><th>Ingredient</th><th>Amount</th><th>Estimated cost</th></tr></thead>{groups.map(group => <tbody key={group.label}><tr><th scope="rowgroup" colSpan={4}>{group.label}</th></tr>{group.items.map(food => { const key = groceryItemKey(food); return <tr key={key}><td><input type="checkbox" aria-label={`Mark ${food.name}, ${food.state}, purchased`} checked={purchased.has(key)} disabled={loading || saving || Boolean(error)} onChange={event => void toggle(key, event.target.checked)} /></td><td><strong>{food.name}</strong><small className="grocery-state">{food.state}</small></td><td>{food.grams >= 1000 ? `${(food.grams / 1000).toFixed(2)} kg` : `${food.grams} g`}</td><td>{rupees(food.costPaise, 2)}</td></tr>; })}</tbody>)}</table><div className="table-footer"><span>Catalog ingredients only · manual meals not itemized</span><strong>{rupees(total, 2)}</strong></div></div></>;
}
