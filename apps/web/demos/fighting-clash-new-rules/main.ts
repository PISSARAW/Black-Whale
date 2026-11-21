import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import type { HeroConfig } from '../fighting-chrollo-intro/hero'
import NenOverlay from '../fighting-nen-explained/NenOverlay.svelte'
import { buildRulesReel } from './script'

const hero = {
  id: 'phinks' as const,
  first: 'CLASH',
  last: 'NEW RULES',
  kicker: 'SIX WAYS A FIGHT CAN TURN',
  build: buildRulesReel,
  outro: { kicker: 'ALL OF IT IS IN THE GAME', word: 'CLASH', tag: 'YOUR TURN' },
  overlay: NenOverlay as HeroConfig['overlay'],
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
