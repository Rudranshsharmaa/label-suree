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
          bg: "#F5F3EA",
          cream: "#E9E8DC",
          "cream-light": "#FAF9F5",
          "dark-green": "#123C2A",
          "deep-green": "#0B291D",
          "medium-green": "#2E6847",
          "light-green": "#DCE8D8",
          "main-text": "#17231C",
          "muted-text": "#47544C", // High-contrast WCAG AA accessible muted text
          warning: "#A86F15",     // High-contrast warning
          error: "#B94A48",
          success: "#26693E",
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(18, 60, 42, 0.04), 0 1px 3px rgba(18, 60, 42, 0.02)',
        'medium': '0 8px 24px rgba(18, 60, 42, 0.08), 0 2px 6px rgba(18, 60, 42, 0.04)',
        'card': '0 4px 16px rgba(18, 60, 42, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
