import { createTrial, getTrialByEmail } from "@/lib/trial";
import { schemas, validateBody, validationErrorResponse } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateBody(schemas.trialSignup, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }

  const { organizationName, adminEmail, adminName, municipality, province } = validation.data;

  // Check for existing trial
  const existing = getTrialByEmail(adminEmail as string);
  if (existing) {
    return Response.json(
      { error: "Esiste già una prova gratuita per questa email.", trial: existing },
      { status: 409 }
    );
  }

  const trial = createTrial({
    organizationName: organizationName as string,
    adminEmail: adminEmail as string,
    adminName: adminName as string,
    municipality: municipality as string,
    province: province as string,
  });

  return Response.json({
    trial,
    message: "Prova gratuita attivata! Hai 30 giorni per esplorare la piattaforma.",
  }, { status: 201 });
}
