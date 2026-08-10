/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#faf6ee",
        ink: "#2b2620",
      },
    },
  },
  plugins: [],
};
