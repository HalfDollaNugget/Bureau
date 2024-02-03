/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'showup': 'showup .2s ease-in-out',
      },
      keyframes: {
        showup: {
          '0%': { transform: 'translateY(10%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }, 
        }
      }
    },
  },
  plugins: [],
};
