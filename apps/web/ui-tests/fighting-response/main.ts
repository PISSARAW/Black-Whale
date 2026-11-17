import { mount } from 'svelte'
import '../../src/app.css'
import { installFrameProbe } from '../fighting-performance/frameProbe'
import Fixture from './Fixture.svelte'
Object.assign(window, {
  responseLab: mount(Fixture, {
    target: document.getElementById('app')!,
    props: { probe: installFrameProbe() },
  }),
})
