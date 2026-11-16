import { readable } from 'svelte/store'
// The isolated Vite fixture has no SvelteKit router. Only the footer's locale link consumes it.
export const page = readable({ url: new URL('http://localhost/fr/fighting/characters') })
