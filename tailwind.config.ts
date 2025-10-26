import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        rp: {
          green: "#7D8D2A",
          orange: "#E3A446",
          text: "#2E2E2E",
          muted: "#6B7280",
          bg: "#F5F6F8"
        }
      },
      borderRadius: {
        "xl2": "1.25rem"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.06)"
      }
    },
    container: {
      center: true
    }
  },
  plugins: []
} satisfies Config;
