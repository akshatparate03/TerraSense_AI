/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#05070a',
          900: '#0a0e14',
          850: '#0d1117',
          800: '#131924',
          700: '#1b2333',
          600: '#26314a',
        },
        accent: {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          emerald: '#34d399',
        },
        risk: {
          low: '#34d399',
          medium: '#f59e0b',
          high: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(34, 211, 238, 0.35)',
        glowRed: '0 0 40px -10px rgba(244, 63, 94, 0.35)',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(ellipse at top, rgba(34,211,238,0.08), transparent 60%)',
      }
    },
  },
  plugins: [],
}
