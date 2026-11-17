import { mount } from 'svelte'
import ShizukuFatality from './ShizukuFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(ShizukuFatality, { target: document.getElementById('app')! }),
})
