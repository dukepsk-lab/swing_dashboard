/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // navy/cyan theme — names kept (`neon-*`) so existing classes retint
        neon: {
          green: "#22d3ee", // primary accent (cyan)
          lime: "#60a5fa",  // sky
          teal: "#3b82f6",  // blue
        },
        dark: {
          900: "#060914",
          800: "#0a0f20",
          700: "#141c34",
          600: "#1b2546",
          500: "#243156",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-in-out",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px #22d3ee, 0 0 10px #3b82f6" },
          "50%": { boxShadow: "0 0 20px #22d3ee, 0 0 40px #3b82f6" },
        },
      },
    },
  },
  plugins: [],
};
