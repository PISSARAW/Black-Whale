import { mount } from 'svelte'
import BiscuitFatality from './BiscuitFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(BiscuitFatality, { target: document.getElementById('app')! }),
})
