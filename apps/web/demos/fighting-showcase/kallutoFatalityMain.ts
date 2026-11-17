import { mount } from 'svelte'
import KallutoFatality from './KallutoFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(KallutoFatality, { target: document.getElementById('app')! }),
})
