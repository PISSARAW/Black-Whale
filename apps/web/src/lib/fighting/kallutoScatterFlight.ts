import { availablePaperScatter, installPaperScatter, newPaperScatter } from './kallutoScatter'
import { issuePaperPart } from './kallutoMaterials'
import type { PaperPart } from './kallutoMaterials'
import type { PaperCommand } from './kallutoPaperTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState, FightProjectile } from './types'

export interface PaperRelease {
  state: FightState
  part: PaperPart
  scatter: PreparedEntity
  reuse: boolean
}
export function releasePaperScatter(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): PaperRelease | null {
  const existing = command === 'serpent' ? availablePaperScatter(state, side) : undefined
  if (existing)
    return {
      state,
      part: {
        id: existing.paperScatter!.paperId,
        materialCopyId: existing.paperScatter!.materialCopyId,
      },
      scatter: existing,
      reuse: true,
    }
  const issued = issuePaperPart(state, side, command)
  if (!issued) return null
  const supplied = { ...state, [side]: issued.actor }
  return {
    state: supplied,
    part: issued.part,
    scatter: newPaperScatter(supplied, side, issued.part),
    reuse: false,
  }
}

export function commitPaperScatter(release: PaperRelease, shot: FightProjectile): FightState {
  const swarm = shot.kallutoPaper === 'serpent'
  const scatter = {
    ...release.scatter,
    present: !swarm,
    paperScatter: {
      ...release.scatter.paperScatter!,
      controlled: true,
      burst: swarm ? undefined : shot.id,
      flight: swarm ? shot.id : undefined,
    },
  }
  return installPaperScatter(release.state, scatter)
}
