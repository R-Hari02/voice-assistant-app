module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      animation: {
        pulseMic: 'pulse 2s infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.2)', opacity: 0.7 },
        },
      },
    },
  },
  plugins: [],
};
