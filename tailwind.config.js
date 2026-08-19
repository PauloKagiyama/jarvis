/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter Tight"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        hull: {
          950: '#06070a',
          900: '#0a0c10',
          800: '#111419',
          700: '#191d24',
          600: '#242932',
        },
        ice: {
          DEFAULT: '#84b6d6',
          dim: '#4d7891',
          bright: '#b9dcf0',
        },
        signal: {
          ok: '#6fbf8f',
          warn: '#d3a04e',
          alert: '#d1614e',
          idle: '#63707d',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        hud: '0.18em',
      },
      transitionTimingFunction: {
        instrument: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
