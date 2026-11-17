import { mount } from 'svelte'
import HalkenburgFatality from './HalkenburgFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(HalkenburgFatality, { target: document.getElementById('app')! }),
})
