import { mount } from 'svelte'
import Showcase from './Showcase.svelte'
Object.assign(window, {
  cameraShowcase: mount(Showcase, { target: document.getElementById('app')! }),
})
