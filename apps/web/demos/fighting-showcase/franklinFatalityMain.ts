import { mount } from 'svelte'
import FranklinFatality from './FranklinFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(FranklinFatality, { target: document.getElementById('app')! }),
})
