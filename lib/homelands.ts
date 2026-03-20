export const HOMELAND_REGIONS: { region: string; countries: string[] }[] = [
  {
    region: "Southern Africa",
    countries: [
      "Botswana", "Eswatini", "Lesotho", "Malawi", "Mozambique",
      "Namibia", "South Africa", "Zambia", "Zimbabwe",
    ],
  },
  {
    region: "West Africa",
    countries: [
      "Benin", "Burkina Faso", "Cape Verde", "Côte d'Ivoire", "Gambia",
      "Ghana", "Guinea", "Guinea-Bissau", "Liberia", "Mali",
      "Mauritania", "Niger", "Nigeria", "Senegal", "Sierra Leone", "Togo",
    ],
  },
  {
    region: "East Africa",
    countries: [
      "Burundi", "Djibouti", "Eritrea", "Ethiopia", "Kenya",
      "Rwanda", "Somalia", "South Sudan", "Sudan", "Tanzania", "Uganda",
    ],
  },
  {
    region: "Central Africa",
    countries: [
      "Cameroon", "Central African Republic", "Chad", "Congo (DRC)",
      "Congo (Republic)", "Equatorial Guinea", "Gabon", "São Tomé & Príncipe",
    ],
  },
  {
    region: "North Africa",
    countries: ["Algeria", "Egypt", "Libya", "Morocco", "Tunisia"],
  },
  {
    region: "Indian Ocean Islands",
    countries: ["Comoros", "Madagascar", "Mauritius", "Seychelles"],
  },
  {
    region: "Caribbean & Americas",
    countries: [
      "Antigua & Barbuda", "Bahamas", "Barbados", "Cuba",
      "Guyana", "Haiti", "Jamaica", "Suriname", "Trinidad & Tobago",
    ],
  },
];

/** All region names as a flat array */
export const ALL_REGIONS = HOMELAND_REGIONS.map((r) => r.region);

/** Get the parent region for a country, or null if not found */
export function getRegionForCountry(country: string): string | null {
  for (const { region, countries } of HOMELAND_REGIONS) {
    if (countries.includes(country)) return region;
  }
  return null;
}

/**
 * Expand a set of selected homelands to include their parent regions.
 * e.g. ["Zimbabwe"] → ["Zimbabwe", "Southern Africa"]
 */
export function expandHomelands(selected: string[]): string[] {
  const expanded = new Set(selected);
  for (const h of selected) {
    const region = getRegionForCountry(h);
    if (region) expanded.add(region);
  }
  return Array.from(expanded);
}

/**
 * Returns true if there is any overlap between the user's (expanded) homelands
 * and an item's homeland_tags.
 */
export function homelandsMatch(
  userHomelands: string[],
  itemTags: string[]
): boolean {
  if (!userHomelands.length || !itemTags.length) return false;
  const expanded = new Set(expandHomelands(userHomelands));
  return itemTags.some((tag) => expanded.has(tag));
}

/** Human-readable label for a homelands array */
export function homelandsLabel(homelands: string[]): string {
  if (!homelands.length) return "";
  if (homelands.length <= 2) return homelands.join(", ");
  return `${homelands.length} homelands`;
}
