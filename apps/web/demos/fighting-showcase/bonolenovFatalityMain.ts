import { mount } from 'svelte'
import BonolenovFatality from './BonolenovFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(BonolenovFatality, { target: document.getElementById('app')! }),
})
