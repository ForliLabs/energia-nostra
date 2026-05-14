import { describe, expect, it } from "vitest";
import { filterSidebarSections, flattenSidebarItems, type SidebarSection } from "@/components/dashboard-navigation";

const sections: SidebarSection[] = [
  {
    label: "Panoramica",
    description: "Flussi principali",
    items: [
      { label: "Energia", href: "/dashboard/energy", icon: null, keywords: ["consumi", "produzione"] },
      { label: "Membri", href: "/dashboard/members", icon: null, keywords: ["soci"] },
    ],
  },
  {
    label: "Piattaforma avanzata",
    description: "Automazione e integrazioni",
    items: [
      { label: "Trading P2P", href: "/dashboard/trading", icon: null, keywords: ["mercato", "scambi"] },
    ],
  },
];

describe("dashboard-navigation", () => {
  it("filters sections by keyword matches", () => {
    const filtered = filterSidebarSections(sections, "scambi");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.label).toBe("Piattaforma avanzata");
    expect(filtered[0]?.items.map((item) => item.href)).toEqual(["/dashboard/trading"]);
  });

  it("returns all sections when query is empty", () => {
    expect(filterSidebarSections(sections, "")).toEqual(sections);
  });

  it("flattens items with searchable metadata", () => {
    const flattened = flattenSidebarItems(sections);
    expect(flattened).toHaveLength(3);
    expect(flattened[0]).toMatchObject({
      label: "Energia",
      href: "/dashboard/energy",
      section: "Panoramica",
    });
    expect(flattened[2]?.searchText).toContain("mercato");
    expect(flattened[2]?.searchText).toContain("piattaforma avanzata");
  });
});
