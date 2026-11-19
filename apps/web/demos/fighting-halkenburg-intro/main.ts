import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildHalkenburgReel } from './script'

const hero = {
  id: 'halkenburg' as const,
  first: 'HALKENBURG',
  last: 'HUI GUO ROU',
  kicker: 'NINTH PRINCE OF KAKIN',
  build: buildHalkenburgReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
