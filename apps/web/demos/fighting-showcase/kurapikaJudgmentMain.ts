import { mount } from 'svelte'
import KurapikaJudgment from './KurapikaJudgment.svelte'
Object.assign(window, {
  fightingShowcase: mount(KurapikaJudgment, { target: document.getElementById('app')! }),
})
