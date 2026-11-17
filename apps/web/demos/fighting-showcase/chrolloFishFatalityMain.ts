import { mount } from 'svelte'
import ChrolloFishFatality from './ChrolloFishFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(ChrolloFishFatality, { target: document.getElementById('app')! }),
})
