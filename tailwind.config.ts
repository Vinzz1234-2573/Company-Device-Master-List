import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // GamutPro brand blue (matches the "g" logomark / "Get Started" button on gamutpro.my)
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#8193f5',
          500: '#5b6eee',
          600: '#4a5ee0',
          700: '#3c4bc4',
          800: '#333f9e',
          900: '#2d3a80',
        },
        // GamutPro dark navy (hero/header background)
        navy: {
          50: '#eef1f8',
          100: '#d7deee',
          200: '#aab6d4',
          300: '#7688b3',
          400: '#4c5f8c',
          500: '#2e3d63',
          600: '#212c4a',
          700: '#182036',
          800: '#131a2b',
          900: '#0d121e',
        },
        // GamutPro gold accent (the dot in "GROW BRAND · GROW BUSINESS")
        gold: {
          400: '#e8c374',
          500: '#d9a441',
          600: '#b9852a',
        },
      },
      backgroundImage: {
        'gamut-accent': 'linear-gradient(90deg, #f472b6 0%, #a78bfa 35%, #60a5fa 65%, #34d399 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
