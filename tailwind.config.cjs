/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-slate-300': {
          'scrollbar-color': '#cbd5e1 transparent',
        },
        '.scrollbar-thumb-slate-600': {
          'scrollbar-color': '#475569 transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          'width': '6px',
          'height': '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          'background': 'transparent',
        },
        '.scrollbar-thumb-slate-300::-webkit-scrollbar-thumb': {
          'background-color': '#cbd5e1',
          'border-radius': '3px',
        },
        '.scrollbar-thumb-slate-600::-webkit-scrollbar-thumb': {
          'background-color': '#475569',
          'border-radius': '3px',
        },
      }
      addUtilities(newUtilities)
    }
  ]
}


