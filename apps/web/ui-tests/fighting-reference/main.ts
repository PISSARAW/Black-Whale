import { mount } from 'svelte'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  referenceFixture: mount(Fixture, { target: document.getElementById('app')! }),
})
