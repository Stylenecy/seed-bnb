/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Flexo Soft Medium"', 'system-ui', 'sans-serif'],
        mono: ['"Flexo Soft Medium"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
