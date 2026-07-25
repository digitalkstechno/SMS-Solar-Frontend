/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",   
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7d558f",
          50: "#f8f5f9",
          100: "#efeaf2",
          200: "#dfd5e5",
          300: "#c8b5d1",
          400: "#ab8fba",
          500: "#926ea5",
          600: "#7d558f",
          700: "#684577",
          800: "#573a62",
          900: "#493252",
        },
      },
    },
  },
  plugins: [],
};