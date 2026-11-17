import { mount } from 'svelte'
import '../../src/app.css'
import Fixture from './Fixture.svelte'
import { installQualificationProbe } from '../fighting-qualification/renderProbe'
const probe = installQualificationProbe()
Object.assign(window, {
  fightExpressions: mount(Fixture, { target: document.getElementById('app')!, props: { probe } }),
})
