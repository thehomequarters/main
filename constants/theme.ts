export const colors = {
  black: "#000000",
  dark: "#1A1A1A",
  darkBorder: "#2A2A2A",
  gold: "#C9A84C",
  white: "#FFFFFF",
  grey: "#A0A0A0",
  green: "#4CAF50",
  red: "#E53935",
} as const;

export const categories = [
  { key: "restaurant", label: "Restaurants" },
  { key: "bar", label: "Bars" },
  { key: "cafe", label: "Cafes" },
  { key: "experience", label: "Experiences" },
] as const;

export type VenueCategory = "restaurant" | "bar" | "cafe" | "experience";
