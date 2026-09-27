/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f9',
          100: '#dce3f3',
          400: '#3d548f',
          600: '#1e2f5c',
          700: '#16234a',
          800: '#101a38',
          900: '#0b1226',
        },
        cyan: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(16, 26, 56, 0.18)',
        card: '0 4px 20px -4px rgba(16, 26, 56, 0.12)',
      },
      animation: {
        'fade-up': 'fadeUp .4s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

