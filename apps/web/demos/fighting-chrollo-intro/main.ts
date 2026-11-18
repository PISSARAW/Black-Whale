import { mount } from 'svelte'
import Intro from './Intro.svelte'
import { buildReel } from './script'

const hero = {
  id: 'chrollo' as const,
  first: 'CHROLLO',
  last: 'LUCILFER',
  kicker: 'LEADER OF THE PHANTOM TROUPE',
  build: buildReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
