/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "theme-primary": "var(--theme-primary)",
        "theme-primary-hover": "var(--theme-primary-hover)",
        "theme-accent": "var(--theme-accent)",
        "theme-bg": "var(--theme-bg)",
        "theme-bg-dark": "var(--theme-bg-dark)",
        "theme-bg-card": "var(--theme-bg-card)",
        "theme-bg-hover": "var(--theme-bg-hover)",
        "theme-border": "var(--theme-border)",
        "theme-text": "var(--theme-text)",
        "theme-text-muted": "var(--theme-text-muted)",
      },
      gridTemplateColumns: {
        11: "repeat(11, minmax(0, 1fr))",
        12: "repeat(12, minmax(0, 1fr))",
        13: "repeat(13, minmax(0, 1fr))",
        14: "repeat(14, minmax(0, 1fr))",
        15: "repeat(15, minmax(0, 1fr))",
        16: "repeat(16, minmax(0, 1fr))",
        17: "repeat(17, minmax(0, 1fr))",
        18: "repeat(18, minmax(0, 1fr))",
        19: "repeat(19, minmax(0, 1fr))",
        20: "repeat(20, minmax(0, 1fr))",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
      },
      animation: {
        slideIn: "slideIn 0.3s ease-out",
        fadeIn: "fadeIn 0.2s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
        slideInRight: "slideInRight 0.3s ease-out",
        slideOutRight: "slideOutRight 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
