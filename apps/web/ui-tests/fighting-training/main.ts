import { mount } from 'svelte'
import '../../src/app.css'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  trainingFixture: mount(Fixture, { target: document.getElementById('app')! }),
})
