import type { FightState } from './types'

/** Settle a damaging follow-up before a KO or post-mortem sequence can freeze simulation. */
export function releaseBiohazardWounds(state: FightState, graceFrames: number): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const fighter = next[side]
    const restraint = fighter.biohazardRestraint
    if (!restraint || fighter.health >= restraint.healthAtCapture) continue
    const owner = next[restraint.owner]
    next = {
      ...next,
      [side]: { ...fighter, biohazardRestraint: undefined, biohazardGraceFrames: graceFrames },
      [restraint.owner]: {
        ...owner,
        biohazard: owner.biohazard
          ? {
              objects: owner.biohazard.objects.map((object) =>
                object.id !== restraint.objectId ? object : { ...object, phase: 'broken', y: 0 },
              ),
            }
          : undefined,
      },
    }
  }
  return next
}
