/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- ¡ESTA LÍNEA ES FUNDAMENTAL!
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
