import { mount } from 'svelte'
import HisokaFear from './HisokaFear.svelte'
Object.assign(window, {
  fightingShowcase: mount(HisokaFear, { target: document.getElementById('app')! }),
})
