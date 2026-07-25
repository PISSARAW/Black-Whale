import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    // @prisma/client is CommonJS, so we treat it as external
    // and rely on Node.js require() to load it at runtime
    external: ['@prisma/client']
  }
})
