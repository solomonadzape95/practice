import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        q: {
          bg: '#0C0F1A',
          card: '#141826',
          hover: '#1C2235',
          text: '#F0F4FF',
          sub: '#8494B4',
          dim: '#4A5672',
          green: '#00D4A4',
          red: '#FF3F5E',
          purple: '#A78BFA',
        },
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.45)',
        lift: '0 12px 40px rgba(0,0,0,0.55)',
        glow: '0 0 40px rgba(0,0,0,0.6)',
      },
    },
  },
} satisfies Config
