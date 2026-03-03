export const colors = {
  // New light luxury palette
  bg: "#F2EBE0",          // main cream background
  white: "#FFFFFF",        // cards, elevated surfaces
  dark: "#1C1C1E",         // primary text + active states
  stone: "#9A8E82",        // secondary text
  border: "#E0D5C5",       // subtle dividers
  sand: "#EAE0D3",         // pill backgrounds, inactive tints
  // Legacy aliases kept for membership card + splash screens
  black: "#1C1C1E",
  darkBorder: "#E0D5C5",
  darkCard: "#FFFFFF",
  // Accent
  gold: "#C9A84C",
  goldLight: "rgba(201, 168, 76, 0.12)",
  goldBorder: "rgba(201, 168, 76, 0.25)",
  grey: "#9A8E82",
  greyLight: "rgba(154, 142, 130, 0.2)",
  // Status
  green: "#2E7D32",
  red: "#E53935",
  teal: "#4ECDC4",
  purple: "#7B68EE",
} as const;

export const categories = [
  { key: "restaurant", label: "Restaurants" },
  { key: "bar", label: "Bars" },
  { key: "cafe", label: "Cafes" },
  { key: "experience", label: "Experiences" },
] as const;

export type VenueCategory = "restaurant" | "bar" | "cafe" | "experience";
