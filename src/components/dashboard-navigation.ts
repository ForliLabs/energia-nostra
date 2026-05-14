import type { ReactNode } from "react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
  keywords?: string[];
  description?: string;
}

export interface SidebarSection {
  label: string;
  description?: string;
  items: SidebarItem[];
}

export interface CommandPaletteItem {
  label: string;
  href: string;
  section: string;
  description?: string;
  keywords: string[];
  searchText: string;
}

function normaliseQuery(value: string) {
  return value.trim().toLowerCase();
}

function buildSearchText(section: SidebarSection, item: SidebarItem) {
  return [section.label, section.description, item.label, item.description, item.href, ...(item.keywords || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterSidebarSections(sections: SidebarSection[], query: string): SidebarSection[] {
  const normalisedQuery = normaliseQuery(query);
  if (!normalisedQuery) {
    return sections;
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => buildSearchText(section, item).includes(normalisedQuery)),
    }))
    .filter((section) => section.items.length > 0);
}

export function flattenSidebarItems(sections: SidebarSection[]): CommandPaletteItem[] {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      label: item.label,
      href: item.href,
      section: section.label,
      description: item.description ?? section.description,
      keywords: item.keywords || [],
      searchText: buildSearchText(section, item),
    })),
  );
}
