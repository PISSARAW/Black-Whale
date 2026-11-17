import { mount } from 'svelte'
import KurapikaFatality from './KurapikaFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(KurapikaFatality, { target: document.getElementById('app')! }),
})
