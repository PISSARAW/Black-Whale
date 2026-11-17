import { mount } from 'svelte'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  onlineFixture: mount(Fixture, { target: document.getElementById('app')! }),
})
