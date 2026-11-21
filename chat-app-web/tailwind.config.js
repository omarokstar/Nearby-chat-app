/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /**
         * Legacy primary palette retained for backward compatibility with existing utility classes.
         */
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        /**
         * Semantic color tokens derived from the workspace dashboard design system:
         * - surface/surface-secondary: Backgrounds for panels, pills, and message containers
         * - liner: Border and divider tone for high-density cards and inputs
         * - ink/ink-secondary/ink-muted: Hierarchical typography scales (primary, body, metadata)
         * - bubble-mine/bubble-other: Chat message bubble fills for sender vs recipient
         */
        surface:             '#F8F8F8',
        liner:               '#E3E3E3',
        ink:                 '#131313',
        'ink-secondary':     '#5D5D5D',
        'ink-muted':         '#868686',
        'bubble-mine':       '#FFEAEA',
        'bubble-other':      '#F8F8F8',
        'surface-secondary': '#EFEFEF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn .25s ease-out',
        'slide-up':   'slideUp .3s ease-out',
        'slide-down': 'slideDown .3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.6' } },
      },
    },
  },
  plugins: [],
};
