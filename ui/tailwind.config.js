module.exports = {
  content: [
    "./index.html",
    "./src/App.vue",
    "./src/components/**/*.{js,vue}",
    "./src/views/**/*.{js,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var"],
      },
      colors: {
        surface: "#1d2025",
        "surface-2": "#19202b",
      },
      screens: {
        "3xl": "1921px",
        // => @media (min-width: 1921px) { ... }
      },
    },
  },
  plugins: [],
};
