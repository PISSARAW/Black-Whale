import { mount } from 'svelte'
import VoconteFatality from './VoconteFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(VoconteFatality, { target: document.getElementById('app')! }),
})
