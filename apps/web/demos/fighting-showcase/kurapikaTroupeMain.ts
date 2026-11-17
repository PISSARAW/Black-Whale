import { mount } from 'svelte'
import KurapikaTroupe from './KurapikaTroupe.svelte'
Object.assign(window, {
  fightingShowcase: mount(KurapikaTroupe, { target: document.getElementById('app')! }),
})
