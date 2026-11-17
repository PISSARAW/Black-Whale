import { mount } from 'svelte'
import HanzoFatality from './HanzoFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(HanzoFatality, { target: document.getElementById('app')! }),
})
