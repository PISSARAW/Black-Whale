import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildBenjaminReel } from './script'

const hero = {
  id: 'benjamin' as const,
  first: 'BENJAMIN',
  last: 'HUI GUO ROU',
  kicker: 'FIRST PRINCE OF KAKIN',
  build: buildBenjaminReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
