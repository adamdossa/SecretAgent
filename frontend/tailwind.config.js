/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#C41E3A',
          'red-dark': '#8B0000',
          green: '#228B22',
          gold: '#FFD700',
          'snow-white': '#FFFAFA',
          pine: '#01796F',
        }
      }
    },
  },
  plugins: [],
}
