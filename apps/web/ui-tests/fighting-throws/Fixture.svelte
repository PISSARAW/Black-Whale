<script lang="ts">
  import { prepareThrowDemo, type ThrowDemoOptions } from './preparation'
  import { onDestroy } from 'svelte'
  import { Box3, Scene, Vector3, type PerspectiveCamera } from 'three'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { beginFight, createFight } from '$lib/fighting/engine'
  import { confirmedThrow } from '$lib/fighting/throwCinematic'
  import type { FightState } from '$lib/fighting/types'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { humanAnimationRig, type AnimatedHuman } from '$lib/tour/humanAnimation'
  let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
  let comfort = defaultFightComfort()
  let paused = false
  let koEnabled = false
  let freezeKO = false
  let tape: FightState[] = []
  let audit: {
    frame: number
    phase: string | null
    performance: string | null
    powered: boolean
    shot: string | null
    effects: string[]
    camera: number[]
    bodies: number[][]
    origins: number[][]
    finite: boolean
    scissorsGap: number | null
    equipment: {
      staff: boolean
      staffBottom: number | null
      umbrella: boolean
      holstered: boolean
      trueForm: boolean
      blinky: boolean
      spear: boolean
    }
  } | null = null
  const previous = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previous?.apply(this, args)
    if (this.userData.fightView !== 'primary') return
    const camera = args[2] as PerspectiveCamera
    const bodies: number[][] = []
    const origins: number[][] = []
    const rigs: AnimatedHuman[] = []
    let finite = true
    const effects: string[] = []
    this.traverse((node) => {
      finite = finite && node.position.toArray().every(Number.isFinite)
      if (node.name.startsWith('throw-signature:') && visible(node)) effects.push(node.name)
      const rig = humanAnimationRig(node)
      if (rig && !preparedBody(node)) {
        rigs.push(rig)
        origins.push(rig.figure.getWorldPosition(rig.figure.position.clone()).toArray())
        bodies.push([
          rig.figure.rotation.x,
          rig.figure.rotation.y,
          rig.figure.rotation.z,
          rig.figure.position.y,
        ])
      }
    })
    audit = {
      frame: state.frame,
      phase: camera.userData.throwCinematic?.phase ?? null,
      performance: camera.userData.throwCinematic?.performance ?? null,
      powered: camera.userData.throwCinematic?.powered ?? false,
      shot: camera.userData.throwCinematic?.shot ?? null,
      effects,
      camera: camera.position.toArray(),
      bodies,
      origins,
      finite,
      equipment: auditEquipment(this),
      scissorsGap: scissorsGap(rigs),
    }
    if (freezeKO && state.phase === 'finished' && audit.phase === 'turn') {
      paused = true
      freezeKO = false
    }
  }
  onDestroy(() => {
    Scene.prototype.onAfterRender = previous
  })
  function preparedBody(node: import('three').Object3D): boolean {
    if (node.name.startsWith('prepared:') || node.name.startsWith('luini-origin:')) return true
    return node.parent ? preparedBody(node.parent) : false
  }
  function visible(node: import('three').Object3D): boolean {
    return node.visible && (!node.parent || visible(node.parent))
  }
  function auditEquipment(scene: Scene) {
    const staff = scene.getObjectByName('throw-signature:staff')
    const umbrella = scene.getObjectByName('throw-signature:umbrella')
    const gun = scene.getObjectByName('theta-physical-handgun')
    return {
      staff: Boolean(staff && visible(staff)),
      staffBottom: staff?.visible ? new Box3().setFromObject(staff).min.y : null,
      umbrella: Boolean(umbrella && visible(umbrella)),
      holstered: Boolean(gun?.parent?.getObjectByName('fight-chest')),
      trueForm: Boolean(scene.getObjectByName('biscuit-true-form')),
      spear: Boolean(scene.getObjectByName('bonolenov-prologue-spear')?.visible),
      blinky: Boolean(scene.getObjectByName('shizuku-blinky')?.visible),
    }
  }
  function scissorsGap(rigs: AnimatedHuman[]) {
    const side = ['feitan', 'hanzo'].includes(state.player.id) ? 0 : 1
    if (!rigs[side] || !rigs[1 - side]) return null
    const centre = rigs[1 - side].head.getWorldPosition(new Vector3())
    centre.y -= 0.2
    return Math.max(
      ...rigs[side].knees.map((knee, index) => {
        const goal = centre.clone()
        goal.z += index === 0 ? -0.18 : 0.18
        return knee.children[1].getWorldPosition(new Vector3()).distanceTo(goal)
      }),
    )
  }
  function reset(options: ThrowDemoOptions = {}) {
    tape = prepareThrowDemo(options)
    state = tape[0]
    paused = false
    koEnabled = Boolean(options.ko)
    freezeKO = Boolean(options.freezeKO)
    comfort = defaultFightComfort()
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
  stageId={state.environment.stageId}
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
  :global(.fight-audio) {
    display: none !important;
  }
  :global(.fight-stage) {
    height: 100dvh;
  }
  :global(.fight-arena) {
    height: 100% !important;
    min-height: 0 !important;
  }
</style>
