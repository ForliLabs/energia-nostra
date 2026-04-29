import { runSimulation, getSimulations, getSimulationById, compareScenarios } from "@/lib/cer-simulation";
import type { SimulationInput } from "@/lib/cer-simulation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const result = await getSimulationById(id);
    if (!result) return Response.json({ error: "Simulazione non trovata" }, { status: 404 });
    return Response.json(result);
  }

  const simulations = await getSimulations();
  return Response.json({ simulations });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    simulation?: SimulationInput;
    baseSimulation?: SimulationInput;
    variations?: Array<{ name: string; overrides: Partial<SimulationInput> }>;
  };

  if (body.action === "compare" && body.baseSimulation && body.variations) {
    const results = await compareScenarios(body.baseSimulation, body.variations);
    return Response.json({ scenarios: results });
  }

  if (body.simulation) {
    if (!body.simulation.name || !body.simulation.location || !body.simulation.memberCount || !body.simulation.solarKwp) {
      return Response.json({ error: "Nome, località, numero membri e kWp solare richiesti" }, { status: 400 });
    }
    const result = await runSimulation(body.simulation);
    return Response.json(result, { status: 201 });
  }

  return Response.json({ error: "Dati simulazione mancanti" }, { status: 400 });
}
