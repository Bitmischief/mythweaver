const theme = require('tailwindcss/defaultTheme.js');

module.exports = {
  content: [
    './index.html',
    './src/App.vue',
    './src/components/**/*.{js,vue}',
    './src/views/**/*.{js,vue}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...theme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
