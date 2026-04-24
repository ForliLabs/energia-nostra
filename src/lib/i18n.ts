// Multi-Language & EU Expansion (Feature 10)

import { prisma } from "@/lib/prisma";

export type Locale = "it" | "es" | "fr";

export interface LocaleConfig {
  code: Locale;
  name: string;
  flag: string;
  isDefault: boolean;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "it", name: "Italiano", flag: "🇮🇹", isDefault: true },
  { code: "es", name: "Español", flag: "🇪🇸", isDefault: false },
  { code: "fr", name: "Français", flag: "🇫🇷", isDefault: false },
];

// Base Italian translations (used as fallback and source)
const BASE_TRANSLATIONS: Record<string, Record<string, string>> = {
  common: {
    "app.name": "EnergiaNostra",
    "app.tagline": "Comunità Energetiche Rinnovabili",
    "nav.dashboard": "Dashboard",
    "nav.members": "Membri",
    "nav.energy": "Energia",
    "nav.incentives": "Incentivi",
    "nav.governance": "Governance",
    "nav.voting": "Votazioni",
    "nav.billing": "Fatturazione",
    "nav.reports": "Report GSE",
    "nav.meter": "Dati contatore",
    "nav.trading": "Trading P2P",
    "nav.carbon": "Crediti CO₂",
    "nav.documents": "Documenti",
    "nav.gamification": "Sfide & Badge",
    "nav.forecasting": "Previsioni",
    "nav.api": "API & Webhook",
    "nav.admin": "Amministrazione",
    "nav.login": "Accedi",
    "nav.register": "Registrati",
    "nav.logout": "Esci",
    "action.save": "Salva",
    "action.cancel": "Annulla",
    "action.delete": "Elimina",
    "action.edit": "Modifica",
    "action.create": "Crea",
    "action.export": "Esporta",
    "action.download": "Scarica",
    "action.upload": "Carica",
    "action.search": "Cerca",
    "action.filter": "Filtra",
    "action.back": "Indietro",
    "status.active": "Attivo",
    "status.inactive": "Inattivo",
    "status.pending": "In attesa",
    "unit.kwh": "kWh",
    "unit.euro": "€",
    "unit.co2": "CO₂",
    "unit.tonnes": "tonnellate",
  },
  dashboard: {
    "dashboard.title": "Panoramica CER",
    "dashboard.production": "Produzione",
    "dashboard.consumption": "Consumo",
    "dashboard.shared_energy": "Energia condivisa",
    "dashboard.savings": "Risparmio",
    "dashboard.incentive": "Incentivo GSE",
    "dashboard.co2_avoided": "CO₂ evitata",
    "dashboard.self_consumption": "Autoconsumo",
    "dashboard.members_count": "Numero membri",
  },
  energy: {
    "energy.title": "Dati Energetici",
    "energy.production_kwh": "Produzione (kWh)",
    "energy.consumption_kwh": "Consumo (kWh)",
    "energy.shared_kwh": "Energia condivisa (kWh)",
    "energy.balance": "Bilancio energetico",
  },
  billing: {
    "billing.title": "Fatturazione",
    "billing.invoice": "Fattura",
    "billing.amount": "Importo",
    "billing.status_paid": "Pagata",
    "billing.status_issued": "Emessa",
    "billing.status_overdue": "Scaduta",
    "billing.total_invoiced": "Totale fatturato",
    "billing.collection_rate": "Tasso di incasso",
  },
};

// Spanish translations
const ES_TRANSLATIONS: Record<string, Record<string, string>> = {
  common: {
    "app.tagline": "Comunidades Energéticas Renovables",
    "nav.dashboard": "Panel",
    "nav.members": "Miembros",
    "nav.energy": "Energía",
    "nav.incentives": "Incentivos",
    "nav.governance": "Gobernanza",
    "nav.voting": "Votaciones",
    "nav.billing": "Facturación",
    "nav.reports": "Informes CNMC",
    "nav.meter": "Datos del contador",
    "nav.trading": "Trading P2P",
    "nav.carbon": "Créditos CO₂",
    "nav.documents": "Documentos",
    "nav.gamification": "Retos y Logros",
    "nav.forecasting": "Previsiones",
    "nav.api": "API y Webhooks",
    "nav.admin": "Administración",
    "nav.login": "Iniciar sesión",
    "nav.register": "Registrarse",
    "nav.logout": "Cerrar sesión",
    "action.save": "Guardar",
    "action.cancel": "Cancelar",
    "action.delete": "Eliminar",
    "action.edit": "Editar",
    "action.create": "Crear",
    "action.export": "Exportar",
    "action.download": "Descargar",
    "action.upload": "Subir",
    "action.search": "Buscar",
    "action.filter": "Filtrar",
    "action.back": "Volver",
    "status.active": "Activo",
    "status.inactive": "Inactivo",
    "status.pending": "Pendiente",
  },
  dashboard: {
    "dashboard.title": "Resumen de la CER",
    "dashboard.production": "Producción",
    "dashboard.consumption": "Consumo",
    "dashboard.shared_energy": "Energía compartida",
    "dashboard.savings": "Ahorro",
    "dashboard.incentive": "Incentivo CNMC",
    "dashboard.co2_avoided": "CO₂ evitado",
    "dashboard.self_consumption": "Autoconsumo",
    "dashboard.members_count": "Número de miembros",
  },
  energy: {
    "energy.title": "Datos Energéticos",
    "energy.production_kwh": "Producción (kWh)",
    "energy.consumption_kwh": "Consumo (kWh)",
    "energy.shared_kwh": "Energía compartida (kWh)",
    "energy.balance": "Balance energético",
  },
  billing: {
    "billing.title": "Facturación",
    "billing.invoice": "Factura",
    "billing.amount": "Importe",
    "billing.status_paid": "Pagada",
    "billing.status_issued": "Emitida",
    "billing.status_overdue": "Vencida",
    "billing.total_invoiced": "Total facturado",
    "billing.collection_rate": "Tasa de cobro",
  },
};

// French translations
const FR_TRANSLATIONS: Record<string, Record<string, string>> = {
  common: {
    "app.tagline": "Communautés d'Énergie Renouvelable",
    "nav.dashboard": "Tableau de bord",
    "nav.members": "Membres",
    "nav.energy": "Énergie",
    "nav.incentives": "Primes",
    "nav.governance": "Gouvernance",
    "nav.voting": "Votes",
    "nav.billing": "Facturation",
    "nav.reports": "Rapports ENEDIS",
    "nav.meter": "Données compteur",
    "nav.trading": "Échange P2P",
    "nav.carbon": "Crédits CO₂",
    "nav.documents": "Documents",
    "nav.gamification": "Défis et Badges",
    "nav.forecasting": "Prévisions",
    "nav.api": "API et Webhooks",
    "nav.admin": "Administration",
    "nav.login": "Se connecter",
    "nav.register": "S'inscrire",
    "nav.logout": "Déconnexion",
    "action.save": "Enregistrer",
    "action.cancel": "Annuler",
    "action.delete": "Supprimer",
    "action.edit": "Modifier",
    "action.create": "Créer",
    "action.export": "Exporter",
    "action.download": "Télécharger",
    "action.upload": "Importer",
    "action.search": "Rechercher",
    "action.filter": "Filtrer",
    "action.back": "Retour",
    "status.active": "Actif",
    "status.inactive": "Inactif",
    "status.pending": "En attente",
  },
  dashboard: {
    "dashboard.title": "Vue d'ensemble CER",
    "dashboard.production": "Production",
    "dashboard.consumption": "Consommation",
    "dashboard.shared_energy": "Énergie partagée",
    "dashboard.savings": "Économies",
    "dashboard.incentive": "Prime ENEDIS",
    "dashboard.co2_avoided": "CO₂ évité",
    "dashboard.self_consumption": "Autoconsommation",
    "dashboard.members_count": "Nombre de membres",
  },
  energy: {
    "energy.title": "Données Énergétiques",
    "energy.production_kwh": "Production (kWh)",
    "energy.consumption_kwh": "Consommation (kWh)",
    "energy.shared_kwh": "Énergie partagée (kWh)",
    "energy.balance": "Bilan énergétique",
  },
  billing: {
    "billing.title": "Facturation",
    "billing.invoice": "Facture",
    "billing.amount": "Montant",
    "billing.status_paid": "Payée",
    "billing.status_issued": "Émise",
    "billing.status_overdue": "En retard",
    "billing.total_invoiced": "Total facturé",
    "billing.collection_rate": "Taux de recouvrement",
  },
};

const ALL_TRANSLATIONS: Record<Locale, Record<string, Record<string, string>>> = {
  it: BASE_TRANSLATIONS,
  es: ES_TRANSLATIONS,
  fr: FR_TRANSLATIONS,
};

// Translation function
export function t(key: string, locale: Locale = "it"): string {
  const translations = ALL_TRANSLATIONS[locale] || BASE_TRANSLATIONS;
  
  for (const ns of Object.values(translations)) {
    if (ns[key]) return ns[key];
  }
  
  // Fallback to Italian
  if (locale !== "it") {
    for (const ns of Object.values(BASE_TRANSLATIONS)) {
      if (ns[key]) return ns[key];
    }
  }
  
  return key;
}

// Get all translations for a locale
export function getTranslations(locale: Locale = "it"): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Start with Italian as base
  for (const ns of Object.values(BASE_TRANSLATIONS)) {
    Object.assign(result, ns);
  }
  
  // Override with target locale
  if (locale !== "it") {
    const localeTranslations = ALL_TRANSLATIONS[locale];
    if (localeTranslations) {
      for (const ns of Object.values(localeTranslations)) {
        Object.assign(result, ns);
      }
    }
  }
  
  return result;
}

// Country-specific regulatory configuration
export interface CountryRegulation {
  countryCode: string;
  countryName: string;
  incentiveFormula: {
    type: string;
    rateEuroPerMwh: number;
    selfConsumptionBonus: number;
  };
  reportingFormat: string;
  gridEmissionFactor: number;
  regulatoryReference: string;
}

export async function getCountryConfigs(): Promise<CountryRegulation[]> {
  const configs = await prisma.countryConfig.findMany({
    where: { isActive: true },
    orderBy: { countryCode: "asc" },
  });
  return configs.map((c) => ({
    countryCode: c.countryCode,
    countryName: c.countryName,
    incentiveFormula: JSON.parse(c.incentiveFormula),
    reportingFormat: c.reportingFormat,
    gridEmissionFactor: c.gridEmissionFactor,
    regulatoryReference: c.regulatoryReference,
  }));
}

export async function getCountryConfig(countryCode: string): Promise<CountryRegulation | null> {
  const config = await prisma.countryConfig.findUnique({ where: { countryCode } });
  if (!config) return null;
  return {
    countryCode: config.countryCode,
    countryName: config.countryName,
    incentiveFormula: JSON.parse(config.incentiveFormula),
    reportingFormat: config.reportingFormat,
    gridEmissionFactor: config.gridEmissionFactor,
    regulatoryReference: config.regulatoryReference,
  };
}

// Calculate incentives based on country-specific formula
export function calculateIncentive(sharedEnergyKwh: number, regulation: CountryRegulation): number {
  const base = (sharedEnergyKwh / 1000) * regulation.incentiveFormula.rateEuroPerMwh;
  const bonus = (sharedEnergyKwh / 1000) * regulation.incentiveFormula.selfConsumptionBonus;
  return Number((base + bonus).toFixed(2));
}
