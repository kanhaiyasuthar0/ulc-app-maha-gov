/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1) Point to all of your template files
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Add any other paths where you use Tailwind classes
  ],
  // 2) Extend your theme (optional)
  theme: {
    extend: {
      // You can add custom colors, spacing, etc. here
    },
  },
  // 3) Add plugins
  plugins: [require("@tailwindcss/typography")],
};
