import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildTserriednichReel } from './script'

const hero = {
  id: 'tserriednich' as const,
  first: 'TSERRIEDNICH',
  last: 'HUI GUO ROU',
  kicker: 'FOURTH PRINCE OF KAKIN',
  build: buildTserriednichReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
