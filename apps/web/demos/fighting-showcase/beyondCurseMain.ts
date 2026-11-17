import { mount } from 'svelte'
import BeyondCurse from './BeyondCurse.svelte'
Object.assign(window, {
  fightingShowcase: mount(BeyondCurse, { target: document.getElementById('app')! }),
})
