import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildBonolenovReel } from './script'

const hero = {
  id: 'bonolenov' as const,
  first: 'BONOLENOV',
  last: 'NDONGO',
  kicker: 'THE GYUDONDOND DANCER',
  build: buildBonolenovReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
