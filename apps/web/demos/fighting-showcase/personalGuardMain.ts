import { mount } from 'svelte'
import PersonalGuard from './PersonalGuard.svelte'
Object.assign(window, {
  fightingShowcase: mount(PersonalGuard, { target: document.getElementById('app')! }),
})
