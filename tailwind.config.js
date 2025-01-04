/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["docs/index.html", "docs/doc.js"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
