<script lang="ts">
  import { tick } from 'svelte'
  import { get } from 'svelte/store'
  import FightPersonalization from '$lib/components/fighting/FightPersonalization.svelte'
  import FightCeremony from '$lib/components/fighting/FightCeremony.svelte'
  import { createFight } from '$lib/fighting/engine'
  import { createSoloController } from '$lib/fighting/solo/controller'
  import { clashPresentation } from '$lib/fighting/presentation/profile'
  import { clashCareer } from '$lib/fighting/career/profile'
  import { EMPTY_INPUT, type FightInput, type MoveAction } from '$lib/fighting/types'
  let language: 'fr' | 'en' = 'fr'
  let state = createFight('kurapika', 'chrollo')
  export async function english() {
    language = 'en'
    await tick()
  }
  export async function verdict(kind: 'time' | 'round' | 'cat' | 'draw' | 'future') {
    state = {
      ...createFight('kurapika', 'chrollo'),
      phase: 'finished',
      winner: 'player',
      matchWinner: kind === 'time' ? 'player' : null,
      finishReason: kind === 'time' ? 'time' : 'knockout',
    }
    if (kind === 'cat') state.catsName = { victimSide: 'opponent', killerSide: 'player', frame: 1 }
    if (kind === 'draw') state.winner = 'draw'
    if (kind === 'future') state.forecastSimulation = true
    await tick()
  }
  export async function intro(kind: 'full' | 'brief' | 'off') {
    const career = get(clashCareer)
    clashCareer.configure(career.name, { ...career.appearance, intro: kind })
    state = createFight('kurapika', 'chrollo')
    await tick()
  }
  export async function earnReading() {
    const controller = createSoloController({ storage: localStorage })
    const frames = (count: number, input: Partial<FightInput> = {}) => {
      for (let i = 0; i < count; i++) controller.tick(1 / 60, { ...EMPTY_INPUT, ...input })
    }
    const move = (action: MoveAction) =>
      controller.enqueue({ kind: 'move', side: 'player', action, input: 0 })
    controller.start({
      mode: 'story',
      route: 'reading',
      fighter: 'kurapika',
      id: 'wardrobe-test',
      seed: 7,
    })
    controller.begin()
    frames(30, { gyo: true })
    controller.next()
    controller.begin()
    frames(14, { right: true })
    move('light')
    frames(15)
    controller.next()
    controller.begin()
    move('special')
    frames(1)
    move('light')
    frames(30)
    controller.next()
    clashPresentation.load()
    await tick()
    return get(controller).save.routes
  }
</script>

<main>
  <FightPersonalization {language} />
  <div data-ceremony><FightCeremony {language} {state} /></div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0b1925;
    color: #edf4f8;
    font-family: system-ui, sans-serif;
  }
  main {
    max-width: 1000px;
    margin: auto;
    padding: 0.75rem;
    box-sizing: border-box;
  }
</style>
