import { mount } from 'svelte'
import BillFatality from './BillFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(BillFatality, { target: document.getElementById('app')! }),
})
