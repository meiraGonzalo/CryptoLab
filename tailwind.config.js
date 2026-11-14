/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05080f',
          900: '#080d18',
          850: '#0b1220',
          800: '#0f1729',
          750: '#131d33',
          700: '#18233d',
          600: '#22304f',
          500: '#33446a',
        },
        accent: {
          brand: '#38bdf8',
          data: '#60a5fa',
          key: '#fbbf24',
          sub: '#c084fc',
          shift: '#22d3ee',
          mix: '#2dd4bf',
          xor: '#fb7185',
          result: '#34d399',
          private: '#f472b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 24px -6px rgba(56,189,248,0.45)',
      },
    },
  },
  plugins: [],
};
