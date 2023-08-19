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
        sans: ["Gilroy", "sans-serif"],
        gilroy: ["Gilroy", "sans-serif"],
      },
      colors: {
        surface: "#171717",
      },
      screens: {
        "3xl": "1921px",
        // => @media (min-width: 1921px) { ... }
      },
      backgroundImage: {
        dragon: "url('/images/dragon.svg')",
        dragon2: "url('/images/dragon2.png')",
        tiger: "url('/images/tiger.png')",
        hart: "url('/images/hart.png')",
        gods: "url('/images/gods.png')",
        hydra: "url('/images/hydra.png')",
      },
    },
  },
  plugins: [],
};
