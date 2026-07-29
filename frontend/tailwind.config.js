/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        black: "#0a0a0a",
        white: "#f5f5f5",
        // Greys
        "grey-50":  "#fafafa",
        "grey-100": "#f0f0f0",
        "grey-200": "#e0e0e0",
        "grey-300": "#c4c4c4",
        "grey-400": "#a0a0a0",
        "grey-500": "#737373",
        "grey-600": "#525252",
        "grey-700": "#3d3d3d",
        "grey-800": "#262626",
        "grey-900": "#171717",
        "grey-950": "#0f0f0f",
        // Accent — health green
        "green-400":  "#4ade80",
        "green-500":  "#22c55e",
        "green-600":  "#16a34a",
        "green-900":  "#14532d",
        "green-950":  "#052e16",
        // Status
        "amber-400":  "#fbbf24",
        "amber-500":  "#f59e0b",
        "red-400":    "#f87171",
        "red-500":    "#ef4444",
        "red-600":    "#dc2626",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display-xl": ["4.5rem",  { lineHeight: "1.05", letterSpacing: "-0.04em" }],
        "display-lg": ["3.5rem",  { lineHeight: "1.1",  letterSpacing: "-0.03em" }],
        "display":    ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "heading-xl": ["2rem",    { lineHeight: "1.2",  letterSpacing: "-0.02em" }],
        "heading-lg": ["1.5rem",  { lineHeight: "1.3",  letterSpacing: "-0.015em" }],
        "heading":    ["1.25rem", { lineHeight: "1.4",  letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "progress-fill": {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
        "score-ring": {
          "0%":   { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-in":        "fade-in 0.5s ease-out forwards",
        "fade-up":        "fade-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "pulse-soft":     "pulse-soft 2s ease-in-out infinite",
        "shimmer":        "shimmer 2s linear infinite",
        "spin-slow":      "spin-slow 3s linear infinite",
        "float":          "float 4s ease-in-out infinite",
        "progress-fill":  "progress-fill 1.5s ease-out forwards",
      },
      boxShadow: {
        "glow-green": "0 0 24px rgba(34,197,94,0.15)",
        "glow-white": "0 0 24px rgba(255,255,255,0.05)",
        "card":       "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
        "glass":      "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 16px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        "hero-gradient":    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,197,94,0.08) 0%, transparent 60%)",
        "card-gradient":    "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      },
    },
  },
  plugins: [],
};
