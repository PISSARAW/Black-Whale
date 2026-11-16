import { mount } from 'svelte'
import '../../src/app.css'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  cameraFixture: mount(Fixture, { target: document.getElementById('app')! }),
})
