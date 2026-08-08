/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#5B5CEB',
          50:  '#EDEDFD',
          100: '#D9D9FB',
          200: '#B3B3F7',
          500: '#5B5CEB',
          600: '#4748D4',
          700: '#3738BD',
          900: '#1F1FA0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F0F2F8',
        },
        cast: {
          bg:     '#F6F7FB',
          border: '#E3E7F1',
          text:   '#0D1117',
          sub:    '#4B5563',
          muted:  '#9CA3AF',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(13,17,23,0.06), 0 1px 2px -1px rgba(13,17,23,0.04)',
        md:   '0 4px 12px 0 rgba(13,17,23,0.08), 0 2px 4px -2px rgba(13,17,23,0.06)',
        lg:   '0 12px 32px 0 rgba(13,17,23,0.10), 0 4px 8px -4px rgba(13,17,23,0.08)',
        xl:   '0 20px 48px 0 rgba(13,17,23,0.14), 0 8px 16px -8px rgba(13,17,23,0.10)',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
