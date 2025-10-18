/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./shared/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F5F7",        // фон панели
        ink: "#1E1E1E",       // основной текст
        sub: "#6B7280",       // вторичный текст
        line: "#E5E7EB",      // границы
        brand: "#3B82F6",     // акцент (синий)
        danger: "#EF4444",    // красная
      },
      borderRadius: {
        card: "12px",
        smd: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)",
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
