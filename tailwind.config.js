/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        hq: {
          black: "#000000",
          dark: "#1A1A1A",
          gold: "#C9A84C",
          grey: "#A0A0A0",
          border: "#2A2A2A",
        },
      },
    },
  },
  plugins: [],
};
