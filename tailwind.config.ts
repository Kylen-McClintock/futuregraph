import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#05070e",
          900: "#090d18",
          850: "#0e1424",
          800: "#131b30",
          700: "#1c2846",
        },
        luminous: {
          cyan: "#38bdf8",
          indigo: "#818cf8",
          violet: "#a78bfa",
          gold: "#f59e0b",
          emerald: "#34d399",
          crimson: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Newsreader", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 24px -4px rgba(56, 189, 248, 0.35)",
        "glow-indigo": "0 0 24px -4px rgba(129, 140, 248, 0.35)",
        "glow-gold": "0 0 24px -4px rgba(245, 158, 11, 0.35)",
        "glow-crimson": "0 0 24px -4px rgba(251, 113, 133, 0.35)",
        "glow-emerald": "0 0 24px -4px rgba(52, 211, 153, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
