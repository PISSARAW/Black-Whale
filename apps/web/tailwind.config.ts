import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'bw-dark': '#0a0a0f',
        'bw-navy': '#0d1b2a',
        'bw-gold': '#c9a44a',
        'bw-scarlet': '#b22222',
      },
    },
  },
  plugins: [],
} satisfies Config
