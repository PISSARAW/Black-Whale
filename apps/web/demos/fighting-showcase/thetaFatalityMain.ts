import { mount } from 'svelte'
import ThetaFatality from './ThetaFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(ThetaFatality, { target: document.getElementById('app')! }),
})
