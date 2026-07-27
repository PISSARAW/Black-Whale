import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'bw-dark': '#070a0c',
        'bw-navy': '#111a20',
        'bw-gold': '#c8a956',
        'bw-scarlet': '#c85d4e',
      },
      fontFamily: {
        sans: ['Manrope', 'Avenir Next', 'sans-serif'],
        condensed: ['Barlow Condensed', 'Arial Narrow', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
