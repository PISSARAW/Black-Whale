import { mount } from 'svelte'
import IllumiFatality from './IllumiFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(IllumiFatality, { target: document.getElementById('app')! }),
})
