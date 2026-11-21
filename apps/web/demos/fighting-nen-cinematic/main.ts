import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import type { HeroConfig } from '../fighting-chrollo-intro/hero'
import NenOverlay from '../fighting-nen-explained/NenOverlay.svelte'
import { buildNenFilmReel } from './script'

const hero = {
  id: 'hisoka' as const,
  first: 'NEN',
  last: 'EXPLAINED',
  kicker: 'IN THEIR OWN CINEMATICS',
  build: buildNenFilmReel,
  overlay: NenOverlay as HeroConfig['overlay'],
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
