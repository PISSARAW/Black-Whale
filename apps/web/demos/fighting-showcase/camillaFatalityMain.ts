import { mount } from 'svelte'
import CamillaFatality from './CamillaFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(CamillaFatality, { target: document.getElementById('app')! }),
})
