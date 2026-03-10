export const colors = {
  // Warm cream luxury palette
  bg: "#F2EBE0",          // main cream background
  white: "#FFFFFF",        // cards, elevated surfaces
  dark: "#1C1C1E",         // primary text + buttons
  ink: "#0A0A0A",          // richer black for display headings
  stone: "#9A8E82",        // secondary text / captions
  border: "#E0D5C5",       // subtle borders / dividers
  sand: "#EAE0D3",         // pill backgrounds, avatar fills, inactive tints
  gold: "#C9A84C",         // gold accent
  goldLight: "rgba(201,168,76,0.10)",
  // Status
  green: "#2E7D32",
  red: "#E53935",
  // Compatibility aliases — kept so secondary screens compile
  // (dark-themed sub-screens still use these; migrate gradually)
  black: "#1C1C1E",
  darkBorder: "rgba(255,255,255,0.09)",
  darkCard: "#252523",
  grey: "#9A8E82",
  greyLight: "rgba(154,142,130,0.2)",
} as const;

export const fonts = {
  display: "CormorantGaramond_600SemiBold",
  displayItalic: "CormorantGaramond_600SemiBold_Italic",
  body: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
} as const;

export const categories = [
  { key: "restaurant", label: "Restaurants" },
  { key: "bar", label: "Bars" },
  { key: "cafe", label: "Cafes" },
  { key: "experience", label: "Experiences" },
] as const;

export type VenueCategory = "restaurant" | "bar" | "cafe" | "experience";
