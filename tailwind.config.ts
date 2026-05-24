import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
