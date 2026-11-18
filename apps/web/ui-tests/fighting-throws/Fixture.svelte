<script lang="ts">
  import { onDestroy } from 'svelte'
  import { Scene, type PerspectiveCamera } from 'three'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { beginFight, createFight, performThrow, tickFight } from '$lib/fighting/engine'
  import { confirmedThrow } from '$lib/fighting/throwCinematic'
  import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '$lib/fighting/types'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { humanAnimationRig } from '$lib/tour/humanAnimation'
  let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
  let comfort = defaultFightComfort()
  let paused = false
  let koEnabled = false
  let tape: FightState[] = []
  let audit: {
    phase: string | null
    camera: number[]
    bodies: number[][]
    finite: boolean
  } | null = null
  const previous = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previous?.apply(this, args)
    if (this.userData.fightView !== 'primary') return
    const camera = args[2] as PerspectiveCamera
    const bodies: number[][] = []
    let finite = true
    this.traverse((node) => {
      finite = finite && node.position.toArray().every(Number.isFinite)
      const rig = humanAnimationRig(node)
      if (rig)
        bodies.push([
          rig.figure.rotation.x,
          rig.figure.rotation.y,
          rig.figure.rotation.z,
          rig.figure.position.y,
        ])
    })
    audit = {
      phase: camera.userData.throwCinematic?.phase ?? null,
      camera: camera.position.toArray(),
      bodies,
      finite,
    }
  }
  onDestroy(() => {
    Scene.prototype.onAfterRender = previous
  })
  function reset(
    options: {
      side?: FightSide
      id?: FighterId
      tech?: boolean
      miss?: boolean
      ko?: boolean
    } = {},
  ) {
    const base = beginFight(
      createFight(options.id ?? 'hisoka', 'kurapika', { mode: 'versus-local' }),
    )
    const side = options.side ?? 'player'
    const victim = side === 'player' ? 'opponent' : 'player'
    let current: FightState = {
      ...base,
      player: { ...base.player, x: 46 },
      opponent: { ...base.opponent, x: options.miss ? 85 : 51 },
    }
    current = {
      ...current,
      [victim]: {
        ...current[victim],
        health: options.ko ? 1 : current[victim].health,
        throwTechFrames: options.tech ? 8 : 0,
      },
    }
    current = performThrow(current, side)
    tape = [current]
    for (let i = 0; i < 100; i++) {
      current = tickFight(current, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: EMPTY_INPUT,
        ai: false,
      })
      tape.push(current)
    }
    state = tape[0]
    paused = false
    koEnabled = Boolean(options.ko)
  }
  Object.assign(window, {
    throwFixture: {
      reset,
      seek: (age: number) => {
        const found = tape.find((sample) => {
          const frame = confirmedThrow(sample)
          return frame && frame.age >= (age / 24) * frame.duration
        })
        state = found ?? tape[tape.length - 1]
      },
      end: () => {
        state = tape[tape.length - 1]
      },
      pause: (value: boolean) => {
        paused = value
      },
      stable: () => {
        comfort = { ...comfort, camera: 0 }
      },
      snapshot: () => ({ state, audit }),
    },
  })
  reset()
</script>

<FightStage
  {state}
  {comfort}
  {paused}
  language="fr"
  victoryEnabled={koEnabled}
  onAttack={() => {}}
  onThrow={() => {}}
  onCall={() => {}}
  onFinisher={() => {}}
  onControl={() => {}}
/>

<style>
  :global(body) {
    margin: 0;
    background: #05070b;
  }
  :global(.fight-stage) {
    height: 100dvh;
  }
  :global(.fight-arena) {
    height: 100% !important;
    min-height: 0 !important;
  }
</style>
