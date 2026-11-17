import { mount } from 'svelte'
import KurapikaVictory from './KurapikaVictory.svelte'
Object.assign(window, {
  fightingShowcase: mount(KurapikaVictory, { target: document.getElementById('app')! }),
})
