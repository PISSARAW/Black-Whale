import { mount } from 'svelte'
import TerebellumFatality from './TerebellumFatality.svelte'
Object.assign(window, {
  fightingShowcase: mount(TerebellumFatality, { target: document.getElementById('app')! }),
})
