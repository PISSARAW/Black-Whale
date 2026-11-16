<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import * as THREE from 'three'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { COMBAT_ROUTES, combatRoutesFor, type CombatFighter } from '$lib/fighting/combatRoutes'
  import { createCombatRouteFight } from '$lib/fighting/combatRouteFight'
  import { createCombatSchool, advanceCombatSchool } from '$lib/fighting/combatSchool'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT } from '$lib/fighting/types'
  import { fightWorldX, fightWorldY } from '$lib/fighting/fightCoordinates'
  import { benchmarkCombat, benchmarkCamera, distribution } from './performance'
  let state = createCombatRouteFight(COMBAT_ROUTES[0])
  let comfort = defaultFightComfort()
  let running = false
  let current = COMBAT_ROUTES[0].id
  const school = createCombatSchool()
  const match = createFightMatchRuntime()
  match.observeFrames(school.observe)
  let samples: number[] = []
  let lastRender = 0
  let pose = { x: 0, y: 0, z: 0, anchors: [] as Array<{ x: number; y: number }> }
  THREE.Scene.prototype.onAfterRender = function (_renderer, scene, camera) {
    if (!scene.getObjectByName('fight-collision-boxes')) return
    const now = performance.now()
    if (lastRender) samples.push(now - lastRender)
    lastRender = now
    const anchors = [state.player, state.opponent].flatMap((actor) =>
      [0, 1.9].map((height) => {
        const point = new THREE.Vector3(
          fightWorldX(actor.x),
          fightWorldY(actor.y) + height,
          0,
        ).project(camera)
        return { x: point.x, y: point.y }
      }),
    )
    pose = { x: camera.position.x, y: camera.position.y, z: camera.position.z, anchors }
  }
  export function scenario(
    fighter: CombatFighter,
    options: { camera: 0 | 1; gap: number; jump: number; corner: boolean },
  ) {
    running = false
    school.exit()
    const fresh = createCombatRouteFight(combatRoutesFor(fighter)[0])
    const target = options.corner || options.gap > 60 ? 93 : 50
    state = {
      ...fresh,
      player: { ...fresh.player, x: target - options.gap, y: options.jump },
      opponent: { ...fresh.opponent, x: target },
    }
    comfort = { ...comfort, camera: options.camera, shake: 0 }
    resetSamples()
  }
  export function start(fighter: CombatFighter, camera: 0 | 1) {
    current = combatRoutesFor(fighter)[0].id
    comfort = { ...comfort, camera, shake: 0 }
    state = school.start(current, true)
    match.begin(state)
    running = true
    resetSamples()
  }
  export function resetSamples() {
    samples = []
    lastRender = 0
  }
  export function snapshot() {
    return { pose, samples: distribution(samples), failed: !!document.querySelector('.failed') }
  }
  export function performanceReport() {
    return { combat: benchmarkCombat(), camera: benchmarkCamera() }
  }
  onMount(() => {
    let previous = performance.now()
    let raf = 0
    const frame = (now: number) => {
      if (running) {
        if (get(school)?.complete || get(school)?.failed) {
          state = school.start(current, true)
          match.begin(state)
        }
        state = advanceCombatSchool({
          school,
          match,
          state,
          dt: Math.min(0.05, (now - previous) / 1000),
          input: EMPTY_INPUT,
          opponentInput: EMPTY_INPUT,
        })
      }
      previous = now
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  })
</script>

<main>
  <p>{state.player.id} · caméra {comfort.camera === 0 ? 'stable' : 'dynamique'}</p>
  <div class="arena">
    {#key `${state.player.id}:${state.opponent.id}`}<FightScene
        {state}
        {comfort}
        stageId={state.environment.stageId}
      />{/key}
    <FightHud {state} language="fr" />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: white;
  }
  main {
    padding: 0.5rem;
  }
  .arena {
    position: relative;
    height: 560px;
    overflow: hidden;
  }
</style>
