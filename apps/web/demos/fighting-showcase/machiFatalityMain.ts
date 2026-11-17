import { mount } from 'svelte'
import MachiFatality from './MachiFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(MachiFatality, { target: document.getElementById('app')! }),
})
