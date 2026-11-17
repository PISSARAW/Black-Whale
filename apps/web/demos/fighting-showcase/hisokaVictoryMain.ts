import { mount } from 'svelte'
import HisokaVictory from './HisokaVictory.svelte'
Object.assign(window, {
  fightingShowcase: mount(HisokaVictory, { target: document.getElementById('app')! }),
})
