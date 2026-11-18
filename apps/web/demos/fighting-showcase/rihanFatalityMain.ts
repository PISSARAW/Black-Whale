import { mount } from 'svelte'
import RihanFatality from './RihanFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(RihanFatality, { target: document.getElementById('app')! }),
})
