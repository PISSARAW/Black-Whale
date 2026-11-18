import { mount } from 'svelte'
import ZakuroFatality from './ZakuroFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(ZakuroFatality, { target: document.getElementById('app')! }),
})
