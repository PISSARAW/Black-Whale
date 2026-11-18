import { mount } from 'svelte'
import LuiniFatality from './LuiniFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(LuiniFatality, { target: document.getElementById('app')! }),
})
