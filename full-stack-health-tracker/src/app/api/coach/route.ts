import { NextResponse } from "next/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { authFailures, coachMessages } from "@/db/schema";
import { ApiError, apiError, requireUser, checkOrigin, text, getDashboardData } from "@/lib/server";
import { answerFromRecords, localCoachIntent } from "@/lib/coach-engine";
import { interpretWithAI, liveInterpreterConfigured } from "@/lib/coach-provider";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store",Vary:"Cookie"};
async function history(userId:string) { const rows=await db.select().from(coachMessages).where(eq(coachMessages.userId,userId)).orderBy(desc(coachMessages.createdAt),desc(coachMessages.id)).limit(40); return rows.reverse().map(({userId:_user,...item})=>({...item,createdAt:item.createdAt.toISOString()})); }
async function rate(userId:string) {
  const [limit]=await db.insert(authFailures).values({key:`coach:${userId}`,failures:1,expiresAt:new Date(Date.now()+60000)}).onConflictDoUpdate({target:authFailures.key,set:{failures:sql`case when ${authFailures.expiresAt} <= now() then 1 else ${authFailures.failures} + 1 end`,expiresAt:sql`case when ${authFailures.expiresAt} <= now() then now() + interval '1 minute' else ${authFailures.expiresAt} end`}}).returning();
  if (limit.failures>15) throw new ApiError("Nivra needs a short pause. Please try again in a minute.",429,"COACH_RATE_LIMITED",Math.max(1,Math.ceil((limit.expiresAt.getTime()-Date.now())/1000)));
}
export async function GET() {
  try {const user=await requireUser(); return NextResponse.json({messages:await history(user.id),interpreterConfigured:liveInterpreterConfigured(),mode:liveInterpreterConfigured()?"ai-available":"local-guide"},{headers});} catch(error){return apiError(error);}
}
export async function POST(request:Request) {
  try {
    checkOrigin(request); const user=await requireUser(); const body=await request.json();
    const message=text(body?.message,"Message",2000); await rate(user.id);
    const [data,old]=await Promise.all([getDashboardData(user.id),history(user.id)]);
    const previous=[...old].reverse().find(item=>item.role==="user")?.content || "";
    const local=localCoachIntent(message);
    const interpretation=local==="unknown"?await interpretWithAI(message):{intent:null,failed:false};
    const answer=answerFromRecords(message,data,previous,interpretation.intent || undefined);
    const mode=interpretation.failed?"local-fallback":interpretation.intent?"ai-routed":"local-guide";
    const content=(interpretation.failed?"Live interpretation was unavailable. This response uses the source-grounded local guide.\n\n":"")+answer.content;
    const now=new Date();
    await db.transaction(async tx=>{await tx.insert(coachMessages).values([{userId:user.id,role:"user",content:message,sources:[],mode:"user",createdAt:now},{userId:user.id,role:"assistant",content,sources:answer.sources,mode,createdAt:new Date(now.getTime()+1)}]);});
    return NextResponse.json({messages:await history(user.id),mode,topic:answer.intent,contextAsOf:data.syncedAt},{headers});
  } catch(error){return apiError(error);}
}
export async function DELETE(request:Request) {
  try {checkOrigin(request);const user=await requireUser();await db.delete(coachMessages).where(eq(coachMessages.userId,user.id));return NextResponse.json({ok:true},{headers});}catch(error){return apiError(error);}
}
