import type { FighterState } from '../combat/types'
import type { FighterDefinition } from '../fighting/types'
import type { Apparition } from '../tour/apparitions'
import type { HumanAppearance } from '../tour/humanAppearance'
import { FIRST_PERSON_EYES_FORWARD } from '../tour/humanFirstPerson'
import type { Vec2 } from '../tour/types'
import type { ArenaCombatMotion } from './presentation'

export const ARENA_SELF_ID = 'arena-self'

/**
 * How far the eyes sit in front of the neck. The body stands that far behind
 * the camera, so looking down shows the chest rather than the inside of the
 * collar.
 */
export const EYES_FORWARD = FIRST_PERSON_EYES_FORWARD

export interface ArenaSelfBody {
  fighter: FighterDefinition
  state: FighterState
  motion: ArenaCombatMotion
  /** Where the camera stands and looks, as the scene reports it every frame. */
  at: Vec2
  heading: number
  place: { spaceId: string; tierId: string; ground: number }
}

/** The camera looks along (−sin, −cos) of its heading; the neck is behind it. */
function behindEyes(at: Vec2, heading: number): Vec2 {
  return [at[0] + Math.sin(heading) * EYES_FORWARD, at[1] + Math.cos(heading) * EYES_FORWARD]
}

function selfPose(body: ArenaSelfBody): HumanAppearance['pose'] {
  if (body.state.condition === 'down' || body.state.condition === 'ko') return 'fallen'
  if (body.state.intent || body.motion === 'attack') return 'attack'
  if (body.motion === 'guard' || body.state.guardWindow > 0) return 'guard'
  if (body.motion === 'hit') return 'held'
  return 'idle'
}

/**
 * The player's own fighter, worn by the camera. It stands where the eyes
 * stand and turns with them, so looking down shows its chest and feet and a
 * strike or a guard brings its arms into view. Its aura is not drawn on the
 * body: the scene already draws the visitor's aura around the eyes.
 */
export function arenaSelfBody(body: ArenaSelfBody): Apparition {
  return {
    id: ARENA_SELF_ID,
    kind: 'combatant',
    spaceId: body.place.spaceId,
    tierId: body.place.tierId,
    at: behindEyes(body.at, body.heading),
    // A figure faces (sin, cos) of its heading, the camera the opposite way.
    heading: body.heading + Math.PI,
    y: body.place.ground,
    size: 1,
    colour: Number.parseInt(body.fighter.colour.replace('#', ''), 16),
    stage: 0,
    human: {
      role: body.fighter.modelRole,
      identity: body.fighter.modelId,
      pose: selfPose(body),
      aura: 'none',
      firstPerson: true,
    },
    hidden: false,
    pick: false,
  }
}
