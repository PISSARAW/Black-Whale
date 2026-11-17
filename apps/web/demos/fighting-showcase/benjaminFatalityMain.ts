import { mount } from 'svelte'
import BenjaminFatality from './BenjaminFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(BenjaminFatality, { target: document.getElementById('app')! }),
})
