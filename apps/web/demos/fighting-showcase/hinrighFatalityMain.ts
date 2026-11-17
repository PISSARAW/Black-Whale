import { mount } from 'svelte'
import HinrighFatality from './HinrighFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(HinrighFatality, { target: document.getElementById('app')! }),
})
