import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
        accent2: "hsl(var(--accent2))",
        warm: "hsl(var(--warm))",
        line: "hsl(var(--line))",
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      boxShadow: {
        neu: "12px 12px 32px hsl(var(--neu-dark) / 0.55), -12px -12px 32px hsl(var(--neu-light) / 0.9)",
        "neu-sm": "6px 6px 16px hsl(var(--neu-dark) / 0.45), -6px -6px 16px hsl(var(--neu-light) / 0.85)",
        "neu-in": "inset 6px 6px 14px hsl(var(--neu-dark) / 0.5), inset -6px -6px 14px hsl(var(--neu-light) / 0.85)",
        "neu-press": "inset 4px 4px 10px hsl(var(--neu-dark) / 0.55), inset -4px -4px 10px hsl(var(--neu-light) / 0.9)",
        glow: "0 0 60px hsl(var(--accent) / 0.35)",
        "glow-sm": "0 0 28px hsl(var(--accent) / 0.28)",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(60% 60% at 20% 10%, hsl(var(--accent) / 0.28), transparent 60%), radial-gradient(50% 50% at 90% 20%, hsl(var(--accent2) / 0.25), transparent 60%), radial-gradient(60% 60% at 50% 100%, hsl(var(--warm) / 0.25), transparent 60%)",
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
