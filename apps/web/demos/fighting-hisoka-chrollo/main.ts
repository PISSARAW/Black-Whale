import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import type { HeroConfig } from '../fighting-chrollo-intro/hero'
import VersusOverlay from './VersusOverlay.svelte'
import { buildDuelReel } from './script'

const hero = {
  id: 'hisoka' as const,
  first: 'HISOKA',
  last: 'CHROLLO',
  kicker: 'HEAVENS ARENA · 200TH FLOOR',
  build: buildDuelReel,
  overlay: VersusOverlay as HeroConfig['overlay'],
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
