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
        darkBg: 'hsl(220, 26%, 10%)',
        primaryIndigo: 'hsl(243, 75%, 62%)',
        successEmerald: 'hsl(152, 69%, 50%)',
        blockerAmber: 'hsl(38, 92%, 55%)',
        errorRose: 'hsl(355, 80%, 57%)'
      }
    },
  },
  plugins: [],
}
