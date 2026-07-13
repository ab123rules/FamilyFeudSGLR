/** @type {import('tailwindcss').Config} */
export default {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Anton"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        stage: {
          950: '#080a10',
          900: '#0b0e16',
          800: '#131826',
          700: '#1b2233',
        },
        teamA: {
          DEFAULT: '#2F6FFF',
          glow: '#5B8CFF',
          dim: '#16233f',
        },
        teamB: {
          DEFAULT: '#FF3B5C',
          glow: '#FF6B85',
          dim: '#3a1420',
        },
        gold: {
          DEFAULT: '#FFC94D',
          dim: '#3a2f10',
        },
        ok: '#33D17A',
        bad: '#FF4545',
      },
    },
  },
  plugins: [],
}
