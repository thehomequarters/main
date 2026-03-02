export const colors = {
  black: "#000000",
  dark: "#1A1A1A",
  darkBorder: "#2A2A2A",
  darkCard: "#222222",
  gold: "#C9A84C",
  goldLight: "rgba(201, 168, 76, 0.12)",
  goldBorder: "rgba(201, 168, 76, 0.25)",
  white: "#FFFFFF",
  grey: "#A0A0A0",
  greyLight: "rgba(160, 160, 160, 0.25)",
  green: "#4CAF50",
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
