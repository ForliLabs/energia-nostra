import {
  getFinancialDashboard, importBankTransactions, confirmMatch,
  unmatchTransaction, generateCertificazioneUnica, generateBilancio,
  createReconciliationRule,
} from "@/lib/financial-reconciliation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";

  const dashboard = await getFinancialDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    cerId?: string;
    transactions?: Array<{
      date: string; description: string; amountEuro: number;
      direction: string; counterparty?: string; bankName?: string; externalId?: string;
    }>;
    transactionId?: string;
    fiscalYear?: number;
    ruleName?: string; ruleType?: string;
    conditions?: Record<string, unknown>; actions?: Record<string, unknown>;
    priority?: number;
  };

  const cerId = body.cerId || "cer-bertinoro";

  if (body.action === "import-bank" && body.transactions) {
    const result = await importBankTransactions(cerId, body.transactions);
    return Response.json({ result }, { status: 201 });
  }

  if (body.action === "confirm-match" && body.transactionId) {
    await confirmMatch(body.transactionId);
    return Response.json({ success: true });
  }

  if (body.action === "unmatch" && body.transactionId) {
    await unmatchTransaction(body.transactionId);
    return Response.json({ success: true });
  }

  if (body.action === "generate-cu" && body.fiscalYear) {
    const documents = await generateCertificazioneUnica(cerId, body.fiscalYear);
    return Response.json({ documents }, { status: 201 });
  }

  if (body.action === "generate-bilancio" && body.fiscalYear) {
    const bilancio = await generateBilancio(cerId, body.fiscalYear);
    return Response.json({ bilancio }, { status: 201 });
  }

  if (body.action === "create-rule" && body.ruleName && body.ruleType) {
    const rule = await createReconciliationRule({
      cerId, name: body.ruleName, type: body.ruleType,
      conditions: body.conditions || {}, actions: body.actions || {},
      priority: body.priority,
    });
    return Response.json({ rule }, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
