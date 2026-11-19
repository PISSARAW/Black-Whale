import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildFeitanReel } from './script'

const hero = {
  id: 'feitan' as const,
  first: 'FEITAN',
  last: 'PORTOR',
  kicker: 'THE PHANTOM TROUPE’S TORTURER',
  build: buildFeitanReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
