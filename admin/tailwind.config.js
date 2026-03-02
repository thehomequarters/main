/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#C9A84C",
        "gold-light": "rgba(201, 168, 76, 0.12)",
        dark: "#1A1A1A",
        "dark-border": "#2A2A2A",
      },
    },
  },
  plugins: [],
};
