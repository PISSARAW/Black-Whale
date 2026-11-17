import { mount } from 'svelte'
import TserriednichFatality from './TserriednichFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(TserriednichFatality, { target: document.getElementById('app')! }),
})
