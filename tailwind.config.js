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
        ledger: {
          dark: '#1e222d',
          cardDark: '#262c3a',
          cardLight: '#ffffff',
          bgLight: '#f6f7fb',
          primary: '#2563eb', // Clean Blue or Emerald
          expense: '#ef4444', // Red for expense
          income: '#10b981',  // Green for income
        }
      },
      screens: {
        'xs': '375px',
      }
    },
  },
  plugins: [],
}
