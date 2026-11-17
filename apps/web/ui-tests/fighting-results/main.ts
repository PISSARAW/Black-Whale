import { mount } from 'svelte'
import '../../src/app.css'
import '../../src/routes/fighting/fighting.css'
import Fixture from './Fixture.svelte'

mount(Fixture, { target: document.getElementById('app')! })
