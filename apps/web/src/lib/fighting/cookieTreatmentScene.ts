import { createVisitHatsuModel } from './visitHatsuModel'
import {
  controlChest,
  fineControlEase,
  fineControlReduced,
  threadVisible,
} from './fineControlAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { SupportHatsuAccent } from './supportHatsuPresentation'
import type { FightSide, FightState } from './types'

/** Cookie keeps her visit anatomy; only the two shoulder pivots move the real hands. */
export function createCookieTreatmentScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  function build(side: FightSide) {
    const model = createVisitHatsuModel(THREE, {
      model: 'cookie-chan',
      anchor: 'floor',
      joints: ['arm--1', 'arm-1', 'massage-hand--1', 'massage-hand-1'],
    })
    model.fit({ height: 1.65 })
    model.root.name = `cookie-treatment:${side}`
    const scale = model.root.scale.x
    const upper = model.root.getObjectByName('cookie-upper-body')!
    const arms = [-1, 1].map((sign) => {
      const pivot = new THREE.Group()
      pivot.name = `cookie-shoulder:${sign}`
      pivot.position.set(sign * 0.235, 1.24 - 0.65, 0)
      upper.add(pivot)
      for (const name of [`arm-${sign}`, `massage-hand-${sign}`]) {
        const joint = model.joints.get(name)!
        pivot.add(joint)
        joint.position.sub(pivot.position)
      }
      return { sign, pivot, rest: new THREE.Vector3(sign * 0.055, -0.37, 0.27).normalize() }
    })
    model.root.visible = false
    scene.add(model.root)
    return {
      model,
      scale,
      upper,
      arms,
      contact: new THREE.Vector3(),
      anchorKey: '',
      figure: undefined as import('three').Object3D | undefined,
    }
  }
  const models = new Map<FightSide, ReturnType<typeof build>>()
  type Held = ReturnType<typeof build>
  type Session = NonNullable<FightState['player']['cookie']>
  function pose(
    held: Held,
    state: FightState,
    c: { side: FightSide; session: Session; events: SupportHatsuAccent[] },
  ) {
    const { side, session, events } = c
    const { model, scale } = held
    const target = state[session.target]
    const reduced = fineControlReduced(options)
    const opening = events.find((e) => e.owner === side && e.kind === 'treatment')
    const grow = reduced || !opening ? 1 : 0.86 + fineControlEase(opening.age / 18) * 0.14
    model.root.visible = true
    model.root.scale.setScalar(scale * grow)
    const key = `${state.frame}:${target.x}:${target.y}:${target.crouching}:${Boolean(target.arsenalSleep)}`
    const figure = options.figureOf?.(session.target)
    if (held.anchorKey !== key || held.figure !== figure) {
      held.contact.copy(controlChest(options, state, session.target))
      held.anchorKey = key
      held.figure = figure
    }
    placeCookie(held, state, { side, session })
    model.root.updateWorldMatrix(true, true)
    const contact = held.upper.worldToLocal(held.contact.clone())
    animateHands(held, { session: session, contact, reduced })
    model.root.userData.mode = session.mode
    model.root.userData.frames = session.frames
  }
  function placeCookie(held: Held, state: FightState, c: { side: FightSide; session: Session }) {
    const { side, session } = c
    const target = state[session.target]
    const facing = session.target === side ? state[side].facing : state[side].x <= target.x ? 1 : -1
    const resting = session.mode === 'piano'
    held.upper.rotation.x = resting ? 1.45 : 0
    held.model.root.position.set(
      held.contact.x - facing * (resting ? 0.85 : 0.42),
      options.worldY(target.y),
      held.contact.z,
    )
    held.model.root.rotation.set(0, (facing * Math.PI) / 2, 0)
  }
  function animateHands(
    held: Held,
    c: { session: Session; contact: import('three').Vector3; reduced: boolean },
  ) {
    const { session, contact, reduced } = c
    const seconds = reduced ? 0 : session.frames / 60
    for (const { sign, pivot, rest } of held.arms) {
      const beat = reduced ? 0 : Math.sin(seconds * (session.mode === 'piano' ? 7 : 3) + sign * 0.7)
      const reach = contact
        .clone()
        .add(new THREE.Vector3(sign * 0.1, beat * 0.025, 0))
        .sub(pivot.position)
        .normalize()
      pivot.quaternion.setFromUnitVectors(rest, reach)
      pivot.rotateZ(beat * 0.035)
    }
  }
  function syncSide(state: FightState, side: FightSide, events: SupportHatsuAccent[]) {
    const session = state[side].cookie
    let held = models.get(side)
    if (!session || state.phase !== 'fighting' || !threadVisible(options, state, side)) {
      if (held) held.model.root.visible = false
      return
    }
    if (!held) {
      held = build(side)
      models.set(side, held)
    }
    pose(held, state, { side, session, events })
  }
  return {
    sync(state: FightState, events: SupportHatsuAccent[]) {
      for (const side of ['player', 'opponent'] as const) syncSide(state, side, events)
    },
    dispose() {
      models.forEach(({ model }) => model.dispose())
      models.clear()
    },
  }
}
