/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'blue': '#3b82f6',
        'emerald': '#10b981',
        'red': '#ef4444',
        'amber': '#f59e0b',
        'yellow': '#eab308',
        'green': '#22c55e',
        'slate': {
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a',
        },
      },
      opacity: {
        '5': '0.05',
        '10': '0.1',
        '15': '0.15',
        '60': '0.6',
        '75': '0.75',
      },
      spacing: {
        '8.5': '2.125rem',
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'xs': '0.75rem',
      },
    },
  },
  plugins: [],
}
