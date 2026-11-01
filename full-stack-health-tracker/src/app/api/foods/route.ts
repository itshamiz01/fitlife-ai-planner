import { NextResponse } from "next/server";
import { foods, FOOD_REFERENCE, USDA_REFERENCE, PRICE_NOTE } from "@/lib/food-catalog";
export const dynamic="force-static";
export function GET() { return NextResponse.json({ foods, nutritionReference:FOOD_REFERENCE, primaryReference:USDA_REFERENCE, priceNote:PRICE_NOTE, note:"Values are per 100 g in the stated reference state; prices are sample paise per 100 g, not live quotes." },{headers:{"Cache-Control":"public, max-age=3600"}}); }
