/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        '1400': '1400px',
      },
      borderRadius: {
        '2rem': '2rem',
        '2.5rem': '2.5rem',
        '3rem': '3rem',
      },
      boxShadow: {
        'purple-100': '0 20px 40px -15px rgba(147, 51, 234, 0.1)',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
