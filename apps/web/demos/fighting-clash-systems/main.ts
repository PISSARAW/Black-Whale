import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import type { HeroConfig } from '../fighting-chrollo-intro/hero'
import NenOverlay from '../fighting-nen-explained/NenOverlay.svelte'
import { buildSystemsReel } from './script'

const hero = {
  id: 'hisoka' as const,
  first: 'CLASH',
  last: 'IS DIFFERENT',
  kicker: 'THE RULES NO OTHER FIGHTER HAS',
  build: buildSystemsReel,
  outro: { kicker: 'NOW YOU KNOW', word: 'CLASH', tag: 'YOUR TURN' },
  overlay: NenOverlay as HeroConfig['overlay'],
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
