/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#22C55E",
          lime: "#ADFF2F",
          teal: "#00FFD1",
        },
        dark: {
          900: "#020617",
          800: "#0F172A",
          700: "#1E293B",
          600: "#334155",
          500: "#475569",
        },
      },
      fontFamily: {
        sans: ["Fira Sans", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-in-out",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px #39FF14, 0 0 10px #39FF14" },
          "50%": { boxShadow: "0 0 20px #39FF14, 0 0 40px #39FF14" },
        },
      },
    },
  },
  plugins: [],
};

