import { mount } from 'svelte'
import MizaistomFatality from './MizaistomFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(MizaistomFatality, { target: document.getElementById('app')! }),
})
