/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#EEF2F7",
          secondary: "#F8FAFC",
        },
        glass: {
          card: "rgba(255, 255, 255, 0.18)",
          border: "rgba(255, 255, 255, 0.35)",
          hover: "rgba(255, 255, 255, 0.28)",
        },
        accent: {
          primary: "#2563EB",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
        },
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
        }
      },
      fontFamily: {
        sans: ["Poppins", "Arial", "sans-serif"],
        heading: ["Montserrat", "Arial", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        glassHover: "0 8px 32px 0 rgba(31, 38, 135, 0.12)",
      },
      backdropBlur: {
        glass: "12px",
      }
    },
  },
  plugins: [],
}
