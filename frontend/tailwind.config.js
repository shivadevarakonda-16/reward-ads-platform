/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        oxygen: {
          red: '#EB0028',
          redHover: '#C50022',
          redSoft: '#FFEBEE',
          darkBg: '#0B0B0C',
          darkCard: '#151517',
          darkSubtle: '#222226',
          darkBorder: '#2A2A30',
          lightBg: '#F4F5F7',
          lightCard: '#FFFFFF',
          lightSubtle: '#EAECEF',
          lightBorder: '#E1E4E8'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'soft-dark': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'glow-red': '0 0 25px rgba(235, 0, 40, 0.35)'
      }
    }
  },
  plugins: []
};
