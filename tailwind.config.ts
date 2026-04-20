import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0B1220",
        panel: "#101A2F",
        stroke: "#263247",
        accent: "#16A34A",
        cyan: "#06B6D4",
        coral: "#F97316",
        gold: "#EAB308",
        ink: "#E5EEF9",
        muted: "#94A3B8"
      },
      boxShadow: {
        glow: "0 18px 60px rgba(6, 182, 212, 0.18)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
