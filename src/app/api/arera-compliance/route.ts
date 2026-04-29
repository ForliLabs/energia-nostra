import {
  getComplianceDashboard, completeDeadline, recordRegulatoryChange,
  analyzeRegulatoryImpact, updateRule,
} from "@/lib/arera-compliance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || undefined;

  const dashboard = await getComplianceDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    deadlineId?: string; completedBy?: string;
    changeId?: string;
    source?: string; title?: string; summary?: string;
    deliberationRef?: string; publishedAt?: string;
    effectiveAt?: string; impactLevel?: string; affectedRules?: string[];
    ruleCode?: string; newValue?: number | string; effectiveFrom?: string; ruleSource?: string;
  };

  if (body.action === "complete-deadline" && body.deadlineId && body.completedBy) {
    await completeDeadline(body.deadlineId, body.completedBy);
    return Response.json({ success: true });
  }

  if (body.action === "record-change") {
    if (!body.source || !body.title || !body.summary || !body.impactLevel) {
      return Response.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    const change = await recordRegulatoryChange({
      source: body.source, title: body.title, summary: body.summary,
      deliberationRef: body.deliberationRef,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      effectiveAt: body.effectiveAt ? new Date(body.effectiveAt) : undefined,
      impactLevel: body.impactLevel, affectedRules: body.affectedRules,
    });
    return Response.json({ change }, { status: 201 });
  }

  if (body.action === "analyze-impact" && body.changeId) {
    const impacts = await analyzeRegulatoryImpact(body.changeId);
    return Response.json({ impacts });
  }

  if (body.action === "update-rule" && body.ruleCode && body.newValue !== undefined && body.effectiveFrom && body.ruleSource) {
    const rule = await updateRule(body.ruleCode, body.newValue, new Date(body.effectiveFrom), body.ruleSource);
    return Response.json({ rule });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
