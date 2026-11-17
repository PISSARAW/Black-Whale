import { mount } from 'svelte'
import Fixture from './Fixture.svelte'
const fixture = mount(Fixture, { target: document.getElementById('app')! })
Object.assign(window, { teamsFixture: fixture })
