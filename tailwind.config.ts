import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Space theme colors
        mint: {
          400: '#4FD1C5',
          500: '#38B2AC',
        },
        lavender: {
          400: '#A78BFA',
          500: '#8B5CF6',
        },
        sky: {
          300: '#7DD3FC',
          400: '#38BDF8',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
      },
      fontFamily: {
        sans: ['var(--font-lexend)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    function({ addBase }: { addBase: Function }) {
      addBase({
        'button': {
          '@apply cursor-pointer': {},
        },
      });
    },
  ],
};

export default config; 