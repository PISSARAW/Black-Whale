import { mount } from 'svelte'
import LeorioFatality from './LeorioFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(LeorioFatality, { target: document.getElementById('app')! }),
})
