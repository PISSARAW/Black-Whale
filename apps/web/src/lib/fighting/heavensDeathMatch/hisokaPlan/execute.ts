import { attachGum, pullGum } from '../crowd/actions'
import { updateSpectator } from '../crowd/create'
import { decapitate, launchHead, tieHead } from '../crowd/heads'
import { DT } from '../crowd/step'
import type { CrowdState } from '../crowd/types'
import type { Vec3 } from '../stands/geometry'
import { revive } from '../wounds'
import { distance, type DeathMatchWorld, type HisokaBody } from '../chrolloPlan/world'
import { hisokaGaze, type HisokaDecision, type HisokaIntent } from './tactics'

export const HISOKA_SPEED = 5

/** A blow, a cut or a crushing grip: the body dies, and a copy shows what it was. */
function kill(crowd: CrowdState, id: string): CrowdState {
  return updateSpectator(crowd, id, (spectator) => ({
    ...spectator,
    health: 0,
    posture: 'dead',
    cause: 'trauma',
    gum: false,
    revealedToHisoka: spectator.nature === 'copy' || spectator.revealedToHisoka,
  }))
}

const withCrowd = (world: DeathMatchWorld, crowd: CrowdState) => ({ ...world, crowd })
const withHisoka = (world: DeathMatchWorld, change: Partial<HisokaBody>) => ({
  ...world,
  hisoka: { ...world.hisoka, ...change },
})
const swung = (world: DeathMatchWorld) => ({ lastSwing: world.crowd.frame })

function moveHisoka(world: DeathMatchWorld, to: Vec3): DeathMatchWorld {
  const gap = distance(world.hisoka.at, to)
  const step = HISOKA_SPEED * DT
  const k = gap <= step ? 1 : step / gap
  const from = world.hisoka.at
  const at = {
    x: from.x + (to.x - from.x) * k,
    y: from.y + (to.y - from.y) * k,
    z: from.z + (to.z - from.z) * k,
  }
  return withHisoka(world, { at })
}

function gum(world: DeathMatchWorld, target: string): DeathMatchWorld {
  if (world.hisoka.gumAnchors.includes(target)) return world
  return {
    ...withCrowd(world, attachGum(world.crowd, target)),
    hisoka: { ...world.hisoka, gumAnchors: [...world.hisoka.gumAnchors, target] },
  }
}

function launchCrowd(world: DeathMatchWorld, targets: readonly string[]): DeathMatchWorld {
  let crowd = world.crowd
  for (const id of targets) crowd = pullGum(crowd, id, world.chrollo.at)
  const anchors = world.hisoka.gumAnchors.filter((id) => !targets.includes(id))
  return {
    ...withCrowd(world, crowd),
    hisoka: { ...world.hisoka, gumAnchors: anchors, ...swung(world) },
  }
}

type Applier = (world: DeathMatchWorld, intent: never) => DeathMatchWorld

const APPLY: Partial<Record<HisokaIntent['kind'], Applier>> = {
  move: (world, intent: { to: Vec3 }) => moveHisoka(world, intent.to),
  gum: (world, intent: { target: string }) => gum(world, intent.target),
  cut: (world, intent: { target: string }) => withCrowd(world, kill(world.crowd, intent.target)),
  decapitate: (world, intent: { target: string }) =>
    withCrowd(world, decapitate(world.crowd, intent.target)),
  'tie-head': (world, intent: { head: string; limb: Parameters<typeof tieHead>[2] }) =>
    withCrowd(world, tieHead(world.crowd, intent.head, intent.limb)),
  'launch-head': (world, intent: { head: string; at: Vec3 }) => ({
    ...withCrowd(world, launchHead(world.crowd, intent.head, intent.at)),
    hisoka: { ...world.hisoka, ...swung(world) },
  }),
  swing: (world, intent: { target: string }) => ({
    ...withCrowd(world, kill(world.crowd, intent.target)),
    hisoka: { ...world.hisoka, ...swung(world) },
  }),
  hostage: (world, intent: { target: string }) => {
    const held = gum(world, intent.target)
    return { ...held, hisoka: { ...held.hisoka, hostage: intent.target } }
  },
  'launch-crowd': (world, intent: { targets: string[] }) => launchCrowd(world, intent.targets),
  crush: (world, intent: { target: string }) => withCrowd(world, kill(world.crowd, intent.target)),
  'hammer-gather': (world, intent: { target: string }) => ({
    ...withCrowd(world, attachGum(world.crowd, intent.target)),
    hisoka: { ...world.hisoka, hammer: [...world.hisoka.hammer, intent.target] },
  }),
  /** Each impact kills what it hits and breaks one body off the hammer. */
  'hammer-swing': (world, intent: { target: string }) => ({
    ...withCrowd(world, kill(world.crowd, intent.target)),
    hisoka: {
      ...world.hisoka,
      hammer: world.hisoka.hammer.slice(1),
      hammerSwung: true,
      ...swung(world),
    },
  }),
  reattach: (world) => withHisoka(world, { reattached: true }),
  'program-resuscitation': (world) => withHisoka(world, { resuscitationProgrammed: true }),
  resuscitate: (world) =>
    withHisoka(world, {
      wounds: revive(world.hisoka.wounds),
      resuscitationProgrammed: false,
    }),
  'form-prosthetics': (world) => withHisoka(world, { prosthetics: true }),
  'bind-machi': (world) => withHisoka(world, { machiBound: true }),
}

export interface HisokaOutcome {
  world: DeathMatchWorld
  intent: HisokaIntent
}

/**
 * One frame of Hisoka's composite moves. `leads` says whether the plan also moves his body
 * (CPU or scripted replay); otherwise only his gaze follows, and the player moves him.
 */
export function executeHisoka(
  world: DeathMatchWorld,
  decision: HisokaDecision,
  leads: boolean,
): HisokaOutcome {
  const { intent } = decision
  const facing = hisokaGaze(world)
  const looked = withHisoka(world, { facing })
  if (intent.kind === 'move' && !leads) return { world: looked, intent: { kind: 'hold' } }
  const apply = APPLY[intent.kind] as
    ((world: DeathMatchWorld, intent: HisokaIntent) => DeathMatchWorld) | undefined
  return { world: apply ? apply(looked, intent) : looked, intent }
}
