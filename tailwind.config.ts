import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EDFDF9', 100: '#D5F9F1', 200: '#AEF2E3', 300: '#6DE8D2',
          400: '#33D6BC', 500: '#0DC9A0', 600: '#0AA88A', 700: '#088570',
          800: '#086C5B', 900: '#07574A',
        },
        navy: { 50:'#f0f4ff', 100:'#e0eaff', 500:'#3b5bdb', 600:'#2f4bc7', 700:'#1e3a8a', 800:'#1e3272', 900:'#0f1e4a', 950:'#080e2a' },
        brand: { DEFAULT:'#2563eb', dark:'#1d4ed8', light:'#3b82f6' },
        gold: { DEFAULT:'#d4a017', light:'#fbbf24' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
