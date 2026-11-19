import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildHisokaReel } from './script'

const hero = {
  id: 'hisoka' as const,
  first: 'HISOKA',
  last: 'MOROW',
  kicker: 'THE MAGICIAN',
  build: buildHisokaReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
