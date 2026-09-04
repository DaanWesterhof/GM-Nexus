/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--color-bg)',
          'bg-alt': 'var(--color-bg-alt)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          'text-muted': 'var(--color-text-muted)',
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-text': 'var(--color-primary-text)',
        },
        // Keeping parchment and wood for backward compatibility during refactor, but they will be phased out or used as specific theme names
        parchment: {
          50: '#FBFBF8',
          100: '#F7F3E1',
          200: '#F0EAD2',
          300: '#E8DDB5',
          400: '#DFCFA0',
          500: '#D4BF8B',
        },
        wood: {
          400: '#A67C52',
          500: '#8B5A2B',
          600: '#724A23',
          700: '#5A3A1C',
          800: '#432B15',
          900: '#2C1C0E',
        }
      }
    },
  },
  plugins: [],
}

