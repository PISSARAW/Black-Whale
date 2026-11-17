import { mount } from 'svelte'
import FeitanFatality from './FeitanFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(FeitanFatality, { target: document.getElementById('app')! }),
})
