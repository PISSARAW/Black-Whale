<script lang="ts">
  import * as THREE from 'three'
  import { onMount } from 'svelte'
  import FightStage from '../../src/lib/components/fighting/FightStage.svelte'
  import { defaultFightComfort } from '../../src/lib/fighting/fightComfort'
  import { fightFaceRig } from '../../src/lib/fighting/fightExpressionRig'
  import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
  import { performTrainingAction } from '../../src/lib/fighting/trainingAction'
  import { EMPTY_INPUT } from '../../src/lib/fighting/types'
  import { BASELINE_FIGHTERS, type BaselineFighter } from '../../src/lib/fighting/combatBaseline'
  import {
    emotionalCombatState,
    advanceExpressionCombat,
    type ExpressionSituation,
  } from './scenario'
  import type { installQualificationProbe } from '../fighting-qualification/renderProbe'
  export let probe: ReturnType<typeof installQualificationProbe>
  let expressions = true
  let fighter: BaselineFighter = 'kurapika',
    situation: ExpressionSituation = 'concentration',
    facing: 1 | -1 = 1
  let state = emotionalCombatState({ fighter, situation, facing })
  const comfort = { ...defaultFightComfort(), graphics: 'balanced' as const }
  let scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer
  let renders = 0,
    previous = 0,
    lastCombatCommand = -1
  let intervals: number[] = []
  const viewport = new THREE.Vector4(),
    renderSize = new THREE.Vector2()
  THREE.Scene.prototype.onAfterRender = function (r, s, c) {
    if (s.userData.fightView !== 'primary') return
    r.getViewport(viewport)
    r.getSize(renderSize)
    // Ignore the technique detail inset, which uses another camera on the same scene.
    if (viewport.z < renderSize.x * 0.99 || viewport.w < renderSize.y * 0.99) return
    s.userData.measureFight = true
    probe.draw(r, s.userData.drawnFight)
    for (const root of s.children) {
      const rig = fightFaceRig(root)
      if (rig) rig.active = expressions
    }
    renderer = r
    scene = s
    camera = c
    const now = performance.now()
    if (previous) intervals.push(now - previous)
    previous = now
    renders++
  }
  export function select(options: {
    fighter: BaselineFighter
    situation: ExpressionSituation
    facing?: 1 | -1
    expressions?: boolean
  }) {
    expressions = options.expressions ?? true
    fighter = options.fighter
    situation = options.situation
    facing = options.facing ?? 1
    state = emotionalCombatState({ fighter, situation, facing })
    lastCombatCommand = -1
    intervals = []
    previous = 0
    return { hash: fightReplayHash(state), frame: state.frame }
  }
  export function resetMetrics() {
    probe.reset()
    intervals = []
    previous = 0
  }
  export function inspect() {
    return { scene, camera, renderer, THREE }
  }
  export function snapshot() {
    const roots = scene?.children.filter((root) => fightFaceRig(root)) ?? []
    roots.sort((a, b) => (a.position.x - b.position.x) * facing)
    const root = roots[0],
      rig = root && fightFaceRig(root)
    const head = rig?.eyes[0].node.parent
    let clip = null
    if (head && camera) {
      const box = new THREE.Box3().setFromObject(head)
      const points = [
        box.min,
        box.max,
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      ]
      const rect = renderer.domElement.getBoundingClientRect()
      const projected = points.map((point) => point.project(camera))
      const x = Math.max(
        rect.x,
        rect.x + ((Math.min(...projected.map((p) => p.x)) + 1) * rect.width) / 2 - 8,
      )
      const y = Math.max(
        rect.y,
        rect.y + ((1 - Math.max(...projected.map((p) => p.y))) * rect.height) / 2 - 8,
      )
      const right = Math.min(
        rect.right,
        rect.x + ((Math.max(...projected.map((p) => p.x)) + 1) * rect.width) / 2 + 8,
      )
      const bottom = Math.min(
        rect.bottom,
        rect.y + ((1 - Math.min(...projected.map((p) => p.y))) * rect.height) / 2 + 8,
      )
      clip = { x, y, width: right - x, height: bottom - y }
    }
    return {
      fighter,
      situation,
      expressions,
      probe: probe.result(),
      renders,
      hash: fightReplayHash(state),
      frame: state.frame,
      actualPose: state.player.pose,
      mode: rig?.mode,
      face: rig?.pose,
      clip,
      intervals,
      geometries: renderer?.info.memory.geometries,
      textures: renderer?.info.memory.textures,
      calls: renderer?.info.render.calls,
      failed: Boolean(document.querySelector('.fight-scene.failed')),
    }
  }
  onMount(() => {
    let last = performance.now(),
      accumulator = 0,
      frame = 0
    const advance = (now: number) => {
      accumulator += Math.min(0.05, Math.max(0, (now - last) / 1000))
      if (situation === 'combat')
        while (accumulator >= 1 / 60) {
          const command = Math.floor(state.frame / 45)
          if (command !== lastCombatCommand) {
            lastCombatCommand = command
            state = performTrainingAction({
              state,
              side: command % 2 ? 'opponent' : 'player',
              action: command % 3 ? 'light' : 'heavy',
              input: EMPTY_INPUT,
            })
          }
          state = advanceExpressionCombat(state)
          accumulator -= 1 / 60
        }
      else accumulator = 0
      last = now
      frame = requestAnimationFrame(advance)
    }
    frame = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frame)
  })
</script>

<main>
  <nav aria-label="Expression proof">
    {#each BASELINE_FIGHTERS as id (id)}<button on:click={() => select({ fighter: id, situation })}
        >{id}</button
      >{/each}
    {#each ['concentration', 'effort', 'pain', 'combat'] as mode (mode)}<button
        on:click={() => select({ fighter, situation: mode as ExpressionSituation })}>{mode}</button
      >{/each}
  </nav>
  <p>{fighter} · {situation} · caméra de combat</p>
  <FightStage
    {state}
    {comfort}
    language="fr"
    stageId={state.environment.stageId}
    minimal
    victoryEnabled={false}
    onAttack={() => {}}
    onThrow={() => {}}
    onCall={() => {}}
    onFinisher={() => {}}
    onControl={() => {}}
    onOpponentControl={() => {}}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #e9eef4;
  }
  main {
    padding: 0.5rem;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    padding: 0.35rem 0.65rem;
    border: 1px solid #63727e;
  }
  :global(.fight-arena) {
    height: 560px !important;
    min-height: 560px !important;
  }
</style>
