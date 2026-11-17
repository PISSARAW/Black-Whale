import { mount } from 'svelte'
import ChrolloVictory from './ChrolloVictory.svelte'
Object.assign(window, {
  fightingShowcase: mount(ChrolloVictory, { target: document.getElementById('app')! }),
})
