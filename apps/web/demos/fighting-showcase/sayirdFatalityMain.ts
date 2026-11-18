import { mount } from 'svelte'
import SayirdFatality from './SayirdFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(SayirdFatality, { target: document.getElementById('app')! }),
})
