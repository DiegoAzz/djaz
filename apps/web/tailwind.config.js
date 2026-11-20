/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dj-bg': '#0B101A',
        'dj-panel': '#151D2B',
        'dj-surface': '#1C2638',
        'dj-border': '#2A384F',
        'dj-blue': '#00B8FF',
        'dj-magenta': '#FF3D91',
        'dj-muted': '#94A3B8'
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(0, 184, 255, 0.45)',
        'glow-magenta': '0 0 15px rgba(255, 61, 145, 0.45)',
        'glow-sm-blue': '0 0 8px rgba(0, 184, 255, 0.35)',
        'glow-sm-magenta': '0 0 8px rgba(255, 61, 145, 0.35)'
      }
    },
  },
  plugins: [],
}
