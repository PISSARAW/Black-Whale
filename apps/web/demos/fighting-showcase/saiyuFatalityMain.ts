import { mount } from 'svelte'
import SaiyuFatality from './SaiyuFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(SaiyuFatality, { target: document.getElementById('app')! }),
})
