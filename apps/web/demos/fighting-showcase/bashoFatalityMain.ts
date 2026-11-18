import { mount } from 'svelte'
import BashoFatality from './BashoFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(BashoFatality, { target: document.getElementById('app')! }),
})
