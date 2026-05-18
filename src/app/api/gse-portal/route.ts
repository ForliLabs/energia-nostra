import {
  getGsePortalDashboard, submitToGse, retrySubmission,
  reconcileWithGse, resolveDiscrepancy, getSubmissionsByPeriod,
} from "@/lib/gse-portal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-forli-centro";
  const view = searchParams.get("view"); // dashboard | submissions

  if (view === "submissions") {
    const submissions = await getSubmissionsByPeriod(cerId);
    return Response.json({ submissions });
  }

  const dashboard = await getGsePortalDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    cerId?: string; period?: string; type?: string;
    reportData?: {
      cerName: string; cerCode: string; sharedEnergyKwh: number;
      totalIncentiveEuro: number;
      memberAllocations: Array<{
        podCode: string; name: string; type: string;
        energyKwh: number; sharePct: number; incentiveEuro: number;
      }>;
    };
    submissionId?: string;
    platformIncentive?: number; gseIncentive?: number;
    reconciliationId?: string; resolution?: string;
  };

  const cerId = body.cerId || "cer-forli-centro";

  if (body.action === "submit" && body.period && body.type && body.reportData) {
    const result = await submitToGse({
      cerId, period: body.period, type: body.type, reportData: body.reportData,
    });
    return Response.json({ submission: result }, { status: 201 });
  }

  if (body.action === "retry" && body.submissionId) {
    try {
      const result = await retrySubmission(body.submissionId);
      return Response.json({ submission: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore retry";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "reconcile" && body.period && body.platformIncentive !== undefined && body.gseIncentive !== undefined) {
    const result = await reconcileWithGse(cerId, body.period, body.platformIncentive, body.gseIncentive);
    return Response.json({ reconciliation: result }, { status: 201 });
  }

  if (body.action === "resolve-discrepancy" && body.reconciliationId && body.resolution) {
    await resolveDiscrepancy(body.reconciliationId, body.resolution);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
