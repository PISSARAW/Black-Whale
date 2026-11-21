import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import type { HeroConfig } from '../fighting-chrollo-intro/hero'
import NenOverlay from './NenOverlay.svelte'
import { buildNenReel } from './script'

const hero = {
  id: 'hisoka' as const,
  first: 'NEN',
  last: 'EXPLAINED',
  kicker: 'THE COMPLETE GUIDE',
  build: buildNenReel,
  overlay: NenOverlay as HeroConfig['overlay'],
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
