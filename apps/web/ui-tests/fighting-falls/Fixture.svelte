<script lang="ts">
  import { tick } from 'svelte'
  import { Box3, PerspectiveCamera, Scene, Vector3 } from 'three'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import { createFightState } from '$lib/fighting/fightState'
  import { performMove, tickFight } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { fightReplayHash } from '$lib/fighting/fightReplayHash'
  import { EMPTY_INPUT, type FighterId, type FightSide } from '$lib/fighting/types'

  let state = createFightState('kurapika', 'hisoka')
  let seconds: number | undefined = 0
  let active = true
  let live = false
  let generation = 0
  let side: FightSide = 'player'
  let mode: 'ground' | 'air' = 'ground'
  const comfort = { ...defaultFightComfort(), camera: 0 as const, graphics: 'low' as const }
  let observation: Record<string, unknown> = {}
  let rendered = 0
  Scene.prototype.onBeforeRender = function (renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || renderer.getScissorTest()) return
    const actor = scene.children.find((node) => node.userData.fightSide === side)
    const torso = actor?.getObjectByName('torso')
    if (!actor || !torso) return
    const figure = actor.children[0]
    actor.updateWorldMatrix(true, true)
    const up = new Vector3(0, 1, 0).transformDirection(figure.matrixWorld)
    const bounds = new Box3().setFromObject(figure)
    let outside = 0
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new Vector3(x, y, z).project(camera)
          if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) outside++
        }
    observation = {
      generation,
      seconds,
      rootY: actor.position.y,
      roll: figure.rotation.z,
      upY: up.y,
      torsoBottom: new Box3().setFromObject(torso).min.y,
      sourceY: state[side].y,
      sourceVelocityY: state[side].velocityY,
      outside,
      hash: fightReplayHash(state),
      rendered: ++rendered,
    }
  }
  export function snapshot() {
    return observation
  }
  export async function reset(
    id: FighterId,
    target: FightSide,
    options: { kind: 'ground' | 'air'; velocityY?: number },
  ) {
    const { kind, velocityY = 35 } = options
    side = target
    mode = kind
    seconds = 0
    active = true
    live = false
    state = createFightState(
      target === 'player' ? id : 'kurapika',
      target === 'opponent' ? id : 'hisoka',
      {
        mode: 'versus-local',
      },
    )
    state = {
      ...state,
      phase: 'fighting',
      player: { ...state.player, x: 44 },
      opponent: { ...state.opponent, x: 50 },
      [side]: {
        ...state[side],
        x: side === 'player' ? 44 : 50,
        pose: kind === 'ground' ? 'down' : 'jump',
        knockdownFrames: kind === 'ground' ? 42 : 0,
        y: kind === 'air' ? (velocityY < 0 ? 8 : 2) : 0,
        velocityY: kind === 'air' ? velocityY : 0,
        health: kind === 'air' ? 1 : state[side].health,
      },
    }
    if (kind === 'air') {
      state = performMove({
        state,
        side: side === 'player' ? 'opponent' : 'player',
        action: velocityY < 0 ? 'light' : 'heavy',
      })
      for (let i = 0; i < 60 && state.phase === 'fighting'; i++)
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      if (state.phase !== 'finished' || state[side].y <= 0)
        throw Error('Expected a real aerial knockout')
    }
    generation++
    await tick()
    return { generation, hash: fightReplayHash(state) }
  }
  export async function at(time: number, wakeup = false) {
    seconds = time
    if (mode === 'ground')
      state = {
        ...state,
        [side]: {
          ...state[side],
          pose: wakeup ? 'wakeup' : 'down',
          knockdownFrames: wakeup ? 0 : Math.max(1, Math.round(42 * (1 - Math.min(1, time / 0.7)))),
          wakeupInvulnerableFrames: wakeup
            ? Math.max(1, Math.round(18 * (1 - Math.min(1, (time - 1) / 0.3))))
            : 0,
        },
      }
    await tick()
  }
  export async function realtime() {
    seconds = undefined
    live = true
    generation++
    await tick()
  }
  export async function pause(paused: boolean) {
    active = !paused
    await tick()
  }
</script>

<main>
  {#key generation}
    {#if live}
      <FightLiveScene {state} {comfort} {active} stageId="heavens-arena" />
    {:else}
      <FightScene
        {state}
        {comfort}
        {active}
        presentationSeconds={seconds}
        stageId="heavens-arena"
        hideSecondaryView
      />
    {/if}
  {/key}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    min-height: 420px;
  }
</style>
