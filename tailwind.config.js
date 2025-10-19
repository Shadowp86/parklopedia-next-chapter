/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          base: '#1B1B1F',
          surface: '#252529',
          elevated: '#2F2F33',
        },
        light: {
          base: '#FFFFFF',
          surface: '#F4F6F8',
          elevated: '#FFFFFF',
        },
        accent: {
          blue: '#00B0FF',
          'blue-dark': '#0091CC',
        },
        highlight: '#FFD600',
        alert: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'floating': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s ease-in-out 3',
      },
    },
  },
  plugins: [],
};
