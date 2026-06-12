import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#111111',
          700: '#333333',
          600: '#555555',
          500: '#767676',
          400: '#8A8A8A',
          200: '#E5E5E5',
        },
        paper: '#F7F5F2',
        // Roza paleta ostaje ISKLJUČIVO zbog /crm i LeadSaveButton (van obima redizajna).
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
      letterSpacing: {
        label: '0.14em',
      },
    },
  },
  plugins: [],
};
export default config;
