import { mount } from 'svelte'
import NobunagaFatality from './NobunagaFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(NobunagaFatality, { target: document.getElementById('app')! }),
})
