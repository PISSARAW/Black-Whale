import { mount } from 'svelte'
import Intro from '../fighting-chrollo-intro/Intro.svelte'
import { buildKurapikaReel } from './script'

const hero = {
  id: 'kurapika' as const,
  first: 'KURAPIKA',
  last: 'KURTA',
  kicker: 'THE LAST OF THE KURTA CLAN',
  build: buildKurapikaReel,
}
Object.assign(window, {
  comboEdit: mount(Intro, { target: document.getElementById('app')!, props: { hero } }),
})
