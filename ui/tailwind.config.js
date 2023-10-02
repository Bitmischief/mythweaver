const FormKitVariants = require('@formkit/themes/tailwindcss');

module.exports = {
  content: [
    './index.html',
    './src/App.vue',
    './src/components/**/*.{js,vue}',
    './src/views/**/*.{js,vue}',
    './tailwind-theme.ts',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        gilroy: ['Gilroy', 'sans-serif'],
      },
      colors: {
        surface: '#0A090C',
        'surface-2': '#161518',
        gradient:
          'linear-gradient(to right, rgba(64, 170, 241, 0.8), rgba(217, 117, 244, 0.8))',
      },
      screens: {
        '3xl': '1921px',
        // => @media (min-width: 1921px) { ... }
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), FormKitVariants],
  variants: {
    extend: {
      display: ['group-hover'],
    },
  },
};
