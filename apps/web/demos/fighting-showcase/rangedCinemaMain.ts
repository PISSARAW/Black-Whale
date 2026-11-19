import { mount } from 'svelte'
import RangedCinema from './RangedCinema.svelte'
Object.assign(window, {
  fightingShowcase: mount(RangedCinema, { target: document.getElementById('app')! }),
})
