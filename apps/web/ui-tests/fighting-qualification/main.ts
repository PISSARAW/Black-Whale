import { mount } from 'svelte'
import '../../src/app.css'
import { installQualificationProbe } from './renderProbe'
import Fixture from './Fixture.svelte'
const probe = installQualificationProbe()
Object.assign(window, {
  commandQualification: mount(Fixture, {
    target: document.getElementById('app')!,
    props: { probe },
  }),
})
