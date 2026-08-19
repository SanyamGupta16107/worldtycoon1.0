/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#030712',
          900: '#070b14',
          850: '#0b1120',
          800: '#0f172a',
          750: '#151e34',
          700: '#1e293b',
        },
        cyber: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#a855f7',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.35)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'hud': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}
