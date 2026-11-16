import { mount } from 'svelte'
import '../../src/app.css'
import '../../src/lib/components/fighting/clashLobby.css'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  rosterFixture: mount(Fixture, { target: document.getElementById('app')! }),
})
