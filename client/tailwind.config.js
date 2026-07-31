/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F8F6F1",
          card: "#FFFFFF",
          primary: "#1F8A5B",
          secondary: "#2EA66D",
          gold: "#FFC857",
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          error: "#EF4444",
          dark: "#1E293B",
          muted: "#64748B",
          border: "#E5E7EB",
        },
        background: {
          primary: "#F8F6F1",
          secondary: "#FFFFFF",
        },
        glass: {
          card: "rgba(255, 255, 255, 0.85)",
          border: "#E5E7EB",
          hover: "rgba(31, 138, 91, 0.06)",
        },
        accent: {
          primary: "#1F8A5B",
          secondary: "#2EA66D",
          success: "#22C55E",
          warning: "#F59E0B",
          danger: "#EF4444",
          gold: "#FFC857",
        },
        text: {
          primary: "#1E293B",
          secondary: "#64748B",
        }
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        glass: "0 10px 30px -5px rgba(31, 138, 91, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.02)",
        glassHover: "0 14px 35px -5px rgba(31, 138, 91, 0.1), 0 6px 16px 0 rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px 0 rgba(30, 41, 59, 0.03)",
        primary: "0 8px 20px -4px rgba(31, 138, 91, 0.25)",
        gold: "0 8px 20px -4px rgba(255, 200, 87, 0.35)",
      },
      backdropBlur: {
        glass: "16px",
      }
    },
  },
  plugins: [],
}
