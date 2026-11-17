import { mount } from 'svelte'
import PhinksFatality from './PhinksFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(PhinksFatality, { target: document.getElementById('app')! }),
})
