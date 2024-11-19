const FormKitVariants = require('@formkit/themes/tailwindcss');

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,vue}', 'formkit.theme.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Rebond Grotesque"'],
      },
      colors: {
        surface: '#050712',
        'surface-2': '#0F111B',
        'surface-3': '#1E202A',
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
