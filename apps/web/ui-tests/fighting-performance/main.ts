import { mount } from 'svelte'
import '../../src/app.css'
import { installFrameProbe } from './frameProbe'
import Fixture from './Fixture.svelte'
const probe = installFrameProbe()
Object.assign(window, {
  fightingPerformance: mount(Fixture, {
    target: document.getElementById('app')!,
    props: { probe },
  }),
})
