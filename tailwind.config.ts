import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0E12",
          soft: "#12161C",
          line: "#1E252D",
        },
        parchment: "#E9E4D8",
        muted: "#7C8478",
        brass: {
          DEFAULT: "#C9A15D",
          bright: "#E3BE7E",
        },
        radiant: "#3A6B5C",
        dire: "#9C4A3C",

        // Новая светлая премиальная тема (постепенный редизайн)
        paper: "#FFFFFF",
        "paper-muted": "#F7F7F5",
        graphite: "#111111",
        "graphite-muted": "#6B6B6B",
        hairline: "#E5E5E3",
        "accent-dota": "#C23C2A",
        "accent-success": "#16A34A",
        "accent-danger": "#DC2626",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 20% 20%, rgba(201,161,93,0.06), transparent 40%), radial-gradient(circle at 80% 60%, rgba(58,107,92,0.08), transparent 45%)",
      },
    },
  },
  plugins: [],
};

export default config;
