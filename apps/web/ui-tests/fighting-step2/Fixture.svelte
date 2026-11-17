<script lang="ts">
  import * as THREE from 'three'
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightComfortSettings from '$lib/components/fighting/FightComfortSettings.svelte'
  import FightInputSettings from '$lib/components/fighting/FightInputSettings.svelte'
  import { createFightControls } from '../../src/routes/fighting/fightingControls'
  import { combatRoutesFor } from '$lib/fighting/combatRoutes'
  import { createCombatRouteFight } from '$lib/fighting/combatRouteFight'
  import { setTrainingDummy } from '$lib/fighting/trainingSession'
  import { performTrainingAction } from '$lib/fighting/trainingAction'
  import { beginFight, createFight, performMove, tickFight } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { fightReplayHash } from '$lib/fighting/fightReplayHash'
  import { EMPTY_INPUT, type FightState } from '$lib/fighting/types'
  let state = createCombatRouteFight(combatRoutesFor('hisoka')[0])
  let comfort = defaultFightComfort()
  let language: 'fr' | 'en' = 'fr'
  let futureMode = false
  let viewer: 'player' | 'opponent' = 'player'
  let predictionContexts = 0,
    predictionDraws = 0
  const predictionRenderers = new WeakSet<THREE.WebGLRenderer>()
  let latest: { renderer: THREE.WebGLRenderer; scene: THREE.Scene } | null = null
  let renders = 0,
    commands = 0,
    sequence = 0
  const controls = createFightControls(() => {
    commands++
  })
  THREE.Scene.prototype.onAfterRender = function (renderer, scene) {
    if (scene.userData.fightView === 'prediction') {
      predictionDraws++
      if (!predictionRenderers.has(renderer)) {
        predictionRenderers.add(renderer)
        predictionContexts++
      }
    }
    if (scene.userData.fightView === 'primary') {
      latest = { renderer, scene }
      renders++
    }
  }
  export function snapshot() {
    return {
      predictionContexts,
      predictionDraws,
      forecastFrames: state.parallelFuture?.frames.length ?? 0,
      renders,
      commands,
      hash: fightReplayHash(state),
      graphics: comfort.graphics ?? 'quality',
      frameBuffer: latest
        ? [latest.renderer.domElement.width, latest.renderer.domElement.height]
        : [],
      ratio: latest?.renderer.getPixelRatio(),
      contacts: latest?.scene.children
        .filter((node) => node.name.startsWith('fight-contact-'))
        .map((node) => node.name),
      impact: state.impact
        ? { blocked: state.impact.blocked, parried: state.impact.parried }
        : null,
      failed: Boolean(document.querySelector('.fight-scene.failed')),
    }
  }
  export async function contact(kind: 'hit' | 'guard' | 'parry') {
    let next = setTrainingDummy(createCombatRouteFight(combatRoutesFor('hisoka')[0]), {
      behavior: kind === 'hit' ? 'idle' : 'guard',
    })
    const step = (current: FightState) =>
      tickFight(current, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, guard: kind !== 'hit' },
        ai: false,
      })
    if (kind === 'guard') for (let i = 0; i < 10; i++) next = step(next)
    next = performTrainingAction({ state: next, side: 'player', action: 'light' })
    for (let i = 0; i < 80 && !next.impact; i++) next = step(next)
    if (!next.impact) throw Error('Expected actual contact')
    state = { ...next, impact: { ...next.impact, sequence: ++sequence } }
    await tick()
    return snapshot()
  }
  export function locale(value: 'fr' | 'en') {
    language = value
  }
  export function observe(value: 'player' | 'opponent') {
    viewer = value
  }
  export async function future(enabled: boolean) {
    futureMode = true
    if (enabled) {
      let fresh = beginFight(
        createFight('tserriednich', 'hisoka', { mode: 'versus-ai', formatId: 'knockout' }),
      )
      fresh = {
        ...fresh,
        player: { ...fresh.player, x: 20, aura: 100 },
        opponent: { ...fresh.opponent, x: 76 },
      }
      state = performMove({ state: fresh, side: 'player', action: 'special' })
      for (let i = 0; i < 30; i++)
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    } else {
      state = performMove({ state, side: 'player', action: 'special' })
      for (let i = 0; i < 610; i++)
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    }
    await tick()
  }
  onMount(() => {
    controls.load()
    let frame = 0
    const poll = () => {
      controls.poll('versus-local', true)
      frame = requestAnimationFrame(poll)
    }
    frame = requestAnimationFrame(poll)
    return () => {
      cancelAnimationFrame(frame)
      controls.release()
    }
  })
</script>

<main>
  <h1>Clash · contrôles et rendu</h1>
  <FightComfortSettings bind:comfort {language} />
  <FightInputSettings {controls} {language} />
  {#if futureMode}
    <div class="future-host">
      <FightLiveScene {state} {comfort} {language} {viewer} stageId="heavens-arena" />
    </div>
  {:else}<FightStage
      {state}
      {comfort}
      {language}
      minimal
      stageId="heavens-arena"
      onAttack={() => {}}
      onThrow={() => {}}
      onCall={() => {}}
      onFinisher={() => {}}
      onControl={() => {}}
    />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #e9eef4;
  }
  main {
    padding: 1rem;
  }
  .future-host {
    position: relative;
    height: 520px;
  }
  :global(.fight-arena) {
    height: 520px !important;
    min-height: 520px !important;
  }
</style>
