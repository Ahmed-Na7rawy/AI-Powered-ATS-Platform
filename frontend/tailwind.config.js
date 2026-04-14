/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        border: '#262626',
        textPrimary: '#ffffff',
        textSecondary: '#a3a3a3',
        brand: '#7a5cff',
        brandHover: '#8e73ff',
        success: '#1d9e75',
        danger: '#e24b4a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
