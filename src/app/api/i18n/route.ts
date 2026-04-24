import { getTranslations, getCountryConfigs, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "it") as Locale;
  const view = searchParams.get("view"); // translations | countries | locales

  if (view === "locales") {
    return Response.json({ locales: SUPPORTED_LOCALES });
  }

  if (view === "countries") {
    const countries = await getCountryConfigs();
    return Response.json({ countries });
  }

  const translations = getTranslations(locale);
  return Response.json({ locale, translations });
}
