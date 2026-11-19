import { mount } from 'svelte'
import '../../src/app.css'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  hisokaCombat: mount(Fixture, { target: document.getElementById('app')! }),
})
