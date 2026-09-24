/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: '#0f1419', 800: '#1a1f26', 700: '#242b33', 600: '#2e3640' },
        cyan: { DEFAULT: '#22d3ee', soft: '#67e8f9' },
        lean: { DEFAULT: '#14b8a6', soft: '#2dd4bf' },
        green: { DEFAULT: '#10b981', soft: '#34d399' },
        warn: { DEFAULT: '#f59e0b', soft: '#fbbf24' },
        risk: { DEFAULT: '#ef4444', soft: '#f87171' },
        future: { DEFAULT: '#8b5cf6', soft: '#a78bfa' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(34, 211, 238, 0.15)',
        'glow-risk': '0 0 16px rgba(239, 68, 68, 0.2)',
      },
    },
  },
  plugins: [],
}