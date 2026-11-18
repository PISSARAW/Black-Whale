<script lang="ts">
  import { onDestroy } from 'svelte'
  import { Scene, Vector3, type PerspectiveCamera } from 'three'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { beginFight, createFight } from '$lib/fighting/engine'
  import { prepareBonolenovThrow, type ThrowOptions } from './state'
  import { confirmedThrow } from '$lib/fighting/throwCinematic'
  import { type FightState } from '$lib/fighting/types'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { humanAnimationRig } from '$lib/tour/humanAnimation'
  let state = beginFight(createFight('bonolenov', 'hisoka', { mode: 'versus-local' }))
  let comfort = { ...defaultFightComfort(), graphics: 'performance' as const }
  let paused = false
  let koEnabled = false
  let tape: FightState[] = []
  let audit: {
    phase: string | null
    camera: number[]
    bodies: number[][]
    finite: boolean
    spear: ReturnType<typeof spearAudit>
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
      spear: spearAudit(this),
    }
  }
  function spearAudit(scene: Scene) {
    const spear = scene.getObjectByName('bonolenov-prologue-spear')
    if (!spear?.visible) return null
    const origin = spear.getWorldPosition(new Vector3())
    const axis = spear
      .localToWorld(new Vector3(0, 1.59, 0))
      .sub(origin)
      .normalize()
    return { parent: spear.parent?.name, axis: axis.toArray() }
  }
  onDestroy(() => {
    Scene.prototype.onAfterRender = previous
  })
  function reset(options: ThrowOptions = {}) {
    const run = prepareBonolenovThrow(options)
    tape = run.tape
    state = tape[0]
    paused = false
    koEnabled = Boolean(options.ko)
    comfort = { ...defaultFightComfort(), graphics: 'performance' as const }
  }
  Object.assign(window, {
    throwFixture: {
      reset,
      seek: (age: number) => {
        const found = tape.find((sample) => {
          const frame = confirmedThrow(sample)
          return frame && frame.age >= age * frame.duration
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
  victoryPaused={paused}
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
    height: calc(100dvh - 40px);
  }
  :global(.fight-arena) {
    height: 100% !important;
    min-height: 0 !important;
  }
</style>
