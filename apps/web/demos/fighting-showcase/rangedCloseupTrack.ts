import type { FightState } from '../../src/lib/fighting/types'
import type { CloseupFrame } from './closeupTrack'

/** Every insert samples the same simulation instant as the main duel. */
export function createRangedCloseups(states: FightState[]) {
  let held: CloseupFrame | null = null
  let until = -1
  let lastPortrait = -90
  const frames = states.map((state, index): CloseupFrame | null => {
    const punch = state.projectiles.find(
      (p) => p.remotePunch && p.age >= p.remotePunch.travelFrames - 5,
    )
    const firing = ['ranged', 'special'].includes(state.opponent.attack?.kind ?? '')
    if (punch?.remotePunch) {
      held = {
        kind: 'remote',
        side: 'opponent',
        projectileId: punch.id,
        targetX: punch.remotePunch.targetX,
        label: 'LEORIO · LE POING SURGIT DU SOL',
      }
      until = index + 38
    } else if (held?.kind === 'remote') {
      held = { kind: 'face', side: 'opponent', label: 'FRANKLIN · LA RÉACTION AU POING' }
      until = index + 36
    } else if (firing) {
      held = {
        kind: 'barrage',
        side: 'opponent',
        tip: state.opponent.attack!.frame > 24 ? 'fingers' : undefined,
        label:
          state.opponent.attack!.frame > 24
            ? 'FRANKLIN · RAFALE DES DIX DOIGTS'
            : 'FRANKLIN · DOUBLE MACHINE GUN',
      }
      until = index + 20
    } else if (index >= until) {
      const impact = state.impact
      const newImpact = impact && impact.sequence !== states[index - 1]?.impact?.sequence
      const attack = state.player.attack
      if (attack?.kind === 'special' && attack.frame < 16) {
        held = { kind: 'face', side: 'player', label: 'LEORIO · CHOISIR LA TRAJECTOIRE' }
        until = index + 15
      } else if (newImpact && !impact.blocked && index - lastPortrait >= 60) {
        const side = impact.attacker
        held = {
          kind: 'face',
          side,
          label:
            side === 'player'
              ? 'LEORIO · PRENDRE L’OUVERTURE'
              : 'FRANKLIN · REPRENDRE L’INITIATIVE',
        }
        until = index + 58
        lastPortrait = index
      } else held = null
    }
    return index < until ? held : null
  })
  return {
    frames,
    report: {
      simultaneous: true,
      faceSeconds: frames.filter((f) => f?.kind === 'face').length / 60,
      leorioFaceSeconds:
        frames.filter((f) => f?.kind === 'face' && f.side === 'player').length / 60,
      franklinFaceSeconds:
        frames.filter((f) => f?.kind === 'face' && f.side === 'opponent').length / 60,
      remoteSeconds: frames.filter((f) => f?.kind === 'remote').length / 60,
      barrageSeconds: frames.filter((f) => f?.kind === 'barrage').length / 60,
      shots: frames.flatMap((frame, index) =>
        frame && frame.label !== frames[index - 1]?.label ? [{ second: index / 60, ...frame }] : [],
      ),
    },
  }
}
