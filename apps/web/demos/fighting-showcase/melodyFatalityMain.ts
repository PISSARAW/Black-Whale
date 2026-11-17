import { mount } from 'svelte'
import MelodyFatality from './MelodyFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(MelodyFatality, { target: document.getElementById('app')! }),
})
