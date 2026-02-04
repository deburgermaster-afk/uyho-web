/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#2ecc71",
        teal: "#0d9488",
        "background-light": "#ffffff",
        "background-dark": "#0a0f1a",
        navy: {
          50: '#e7f0ff',
          100: '#d3e4ff',
          200: '#b0ccff',
          300: '#7aa8ff',
          400: '#4278ff',
          500: '#1a4fff',
          600: '#0033ff',
          700: '#0029e6',
          800: '#0022b8',
          900: '#0d1829',
          950: '#0a0f1a',
        },
        dark: {
          100: '#1e293b',
          200: '#1a2234',
          300: '#151c2c',
          400: '#111827',
          500: '#0d1420',
          600: '#0a0f1a',
          700: '#080c14',
          800: '#05080e',
          900: '#030508',
        }
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        bengali: ["Hind Siliguri", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'bounce-slow': 'bounce 2s infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
