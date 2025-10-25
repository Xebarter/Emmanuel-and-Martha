/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Quivira', 'sans-serif'],
      },
      colors: {
        // Removing old coral colors
        'royal-purple-dark': '#1a0033',
        'royal-purple': '#2d0052',
        'royal-purple-light': '#4a0073',
        'royal-purple-luminous': '#6a0dad',
        'warm-gold': '#d4af37',
        'warm-gold-light': '#e6c354',
        'warm-gold-lighter': '#f0d68c',
        'golden-glitter': '#ffecb3',
      },
    },
  },
  plugins: [],
};