import { checkOnboardingProgress } from "@/lib/data-import";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";

  const progress = await checkOnboardingProgress(cerId);
  return Response.json(progress);
}
