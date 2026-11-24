import { mount } from 'svelte'
import '../../src/app.css'
import Fixture from './Fixture.svelte'

const fixture = mount(Fixture, { target: document.getElementById('app')! })
Object.assign(window, {
  feitanSaiyuVideo: {
    advance: (count = 2) => fixture.advance(count),
    diagnostics: () => fixture.diagnostics(),
  },
})

declare global {
  interface Window {
    feitanSaiyuVideo: { advance: (count?: number) => Promise<void>; diagnostics: () => unknown }
  }
}
