import { mount } from 'svelte'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  coachFixture: mount(Fixture, { target: document.getElementById('app')! }),
})
