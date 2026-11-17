import { mount } from 'svelte'
import '../../src/app.css'
import Showcase from './Showcase.svelte'

Object.assign(window, {
  fightingShowcase: mount(Showcase, { target: document.getElementById('app')! }),
})
