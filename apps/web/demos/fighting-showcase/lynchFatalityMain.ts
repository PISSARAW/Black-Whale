import { mount } from 'svelte'
import LynchFatality from './LynchFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(LynchFatality, { target: document.getElementById('app')! }),
})
