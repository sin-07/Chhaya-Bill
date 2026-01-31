/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'print-blue': '#1e5a9e',
        'print-green': '#2d8659',
      },
      fontFamily: {
        'invoice': ['Open Sans', 'sans-serif'],
        'sans': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
