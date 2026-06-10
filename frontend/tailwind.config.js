/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0066cc',
          dark: '#004499',
          light: '#3399ff',
        },
      },
    },
  },
  plugins: [],
};
