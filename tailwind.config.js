/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page:  '#0d0b08',
        card:  '#161210',
        card2: '#1e1a16',
        edge:  '#2a2218',
        edge2: '#3a3028',
        gold:  '#c9a84c',
        gold2: '#e8c96a',
        parch: '#ede6d6',
        ink:   '#f5f0e8',
        muted: '#8a7a68',
        dim:   '#4a3f35',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.35s ease forwards',
        'spin':       'spin 1s linear infinite',
        'flicker':    'flicker 5s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
