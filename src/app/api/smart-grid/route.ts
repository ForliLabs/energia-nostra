import {
  getSmartGridDashboard, registerDevice, sendCommand,
  startChargingSession, stopChargingSession,
  createDrEvent, acknowledgeDrEvent, completeDrEvent,
  recordTelemetry, getDeviceTelemetry,
} from "@/lib/smart-grid";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const view = searchParams.get("view"); // dashboard | telemetry
  const deviceId = searchParams.get("deviceId");

  if (view === "telemetry" && deviceId) {
    const hours = parseInt(searchParams.get("hours") || "24");
    const telemetry = await getDeviceTelemetry(deviceId, hours);
    return Response.json({ telemetry });
  }

  const dashboard = await getSmartGridDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    cerId?: string; name?: string; type?: string; protocol?: string;
    manufacturer?: string; model?: string; serialNumber?: string;
    deviceId?: string; command?: string; parameters?: Record<string, unknown>;
    sessionId?: string; idTag?: string;
    source?: string; signalLevel?: number; startTime?: string; endTime?: string;
    targetKw?: number; eventId?: string; actualKw?: number; revenueEuro?: number;
    metric?: string; value?: number; unit?: string;
  };

  const cerId = body.cerId || "cer-bertinoro";

  if (body.action === "register-device") {
    if (!body.name || !body.type || !body.protocol) {
      return Response.json({ error: "Nome, tipo e protocollo richiesti" }, { status: 400 });
    }
    const device = await registerDevice({
      cerId, name: body.name, type: body.type, protocol: body.protocol,
      manufacturer: body.manufacturer, model: body.model, serialNumber: body.serialNumber,
    });
    return Response.json({ device }, { status: 201 });
  }

  if (body.action === "send-command" && body.deviceId && body.command) {
    const cmd = await sendCommand(body.deviceId, body.command, body.parameters);
    return Response.json({ command: cmd });
  }

  if (body.action === "start-charging" && body.deviceId) {
    const session = await startChargingSession(body.deviceId, body.idTag);
    return Response.json({ session }, { status: 201 });
  }

  if (body.action === "stop-charging" && body.sessionId) {
    const session = await stopChargingSession(body.sessionId);
    return Response.json({ session });
  }

  if (body.action === "create-dr-event") {
    if (!body.source || !body.type || body.signalLevel === undefined || !body.startTime || !body.endTime) {
      return Response.json({ error: "Parametri evento DR mancanti" }, { status: 400 });
    }
    const event = await createDrEvent({
      cerId, source: body.source, type: body.type, signalLevel: body.signalLevel,
      startTime: new Date(body.startTime), endTime: new Date(body.endTime), targetKw: body.targetKw,
    });
    return Response.json({ event }, { status: 201 });
  }

  if (body.action === "acknowledge-dr" && body.eventId) {
    await acknowledgeDrEvent(body.eventId);
    return Response.json({ success: true });
  }

  if (body.action === "complete-dr" && body.eventId && body.actualKw !== undefined && body.revenueEuro !== undefined) {
    await completeDrEvent(body.eventId, body.actualKw, body.revenueEuro);
    return Response.json({ success: true });
  }

  if (body.action === "record-telemetry" && body.deviceId && body.metric && body.value !== undefined && body.unit) {
    await recordTelemetry(body.deviceId, body.metric, body.value, body.unit);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
