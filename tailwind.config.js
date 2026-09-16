/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },

      colors: {
        // ---- Surfaces & text ------------------------------------------------
        hm: {
          bg: "#f6f6f4", // app canvas
          surface: "#ffffff", // panels, tables, cards
          "surface-2": "#fafaf9", // subtle fills, table headers, zebra

          border: "#e7e5e4", // default hairline
          "border-strong": "#d6d3d1",// hover / focus-adjacent

          text: "#0f172a", // primary text
          "text-muted": "#57534e", // secondary
          "text-subtle": "#a8a29e", // metadata, placeholder

          // One primary action per screen. Near-black, not a hue.
          primary: "#0f172a",
          "primary-hover": "#1e293b",
          "primary-fg": "#ffffff",
          "primary-soft": "#f1f5f9",

          // Accent — reserved for POS charge/pay only.
          accent: "#c2410c",
          "accent-hover": "#9a3412",
          "accent-soft": "#fff7ed",

          // Semantic
          success: "#15803d",
          "success-soft": "#f0fdf4",
          warning: "#b45309",
          "warning-soft": "#fffbeb",
          danger: "#b91c1c",
          "danger-soft": "#fef2f2",
          info: "#1d4ed8",
          "info-soft": "#eff6ff"
        }
      },

      borderRadius: {
        "hm-xs": "4px",  // tiny chips, tag
        "hm-sm": "6px",  // controls, buttons, icon buttons
        "hm-md": "8px",  // inputs, selects
        "hm-lg": "10px", // panels, modals
        "hm-xl": "14px"  // rare — big surface
      },

      boxShadow: {
        // Only for things that actually float: modal, popover, dropdown.
        "hm-elevated":
          "0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.08)"
      },

      fontSize: {
        // Deliberate scale. Nothing below 12px is allowed in the UI.
        "hm-meta": ["12px", { lineHeight: "16px" }],
        "hm-body": ["13px", { lineHeight: "20px" }],
        "hm-lead": ["14px", { lineHeight: "22px" }],
        "hm-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "hm-page": ["20px", { lineHeight: "28px", fontWeight: "600", letterSpacing: "-0.01em" }],
        "hm-display": ["24px", { lineHeight: "32px", fontWeight: "600", letterSpacing: "-0.015em" }]
      }
    }
  },
  plugins: []
};