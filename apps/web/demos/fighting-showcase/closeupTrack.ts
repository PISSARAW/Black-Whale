import type { FightState } from '../../src/lib/fighting/types'

export interface CloseupFrame {
  kind: 'eyes' | 'chain' | 'seal'
  label: string
  tip?: string
}

/** Detail shots share the main simulation frame: no replay or pause. */
export function createCloseupTrack(states: FightState[]) {
  let eyesUntil = -1
  const frames = states.map((state, index): CloseupFrame | null => {
    if (state.player.kurapika?.emperorTime && !states[index - 1]?.player.kurapika?.emperorTime)
      eyesUntil = index + 120
    if (index < eyesUntil && state.player.kurapika?.emperorTime)
      return { kind: 'eyes', label: 'EMPEROR TIME · YEUX ÉCARLATES' }
    if (state.opponent.judgmentChain) return { kind: 'seal', label: 'JUDGMENT CHAIN · LE SERMENT' }
    if (state.opponent.drainingChain)
      return { kind: 'chain', label: 'STEAL CHAIN · DRAINAGE', tip: 'syringe' }
    const move = state.player.attack?.moveId?.split(':')[1]
    const tips: Record<string, [string, string]> = {
      forwardSpecial: ['pendulum', 'DOWSING CHAIN · PORTÉE'],
      downSpecial: ['cross', 'HOLY CHAIN · RÉGÉNÉRATION'],
      backSpecial: ['syringe', 'STEAL CHAIN · CAPTURE'],
      finisher: ['blade', 'JUDGMENT CHAIN · IMPLANTATION'],
    }
    const tip = move && tips[move]
    return tip ? { kind: 'chain', tip: tip[0], label: tip[1] } : null
  })
  return {
    frames,
    report: {
      simultaneous: true,
      eyeSeconds: frames.filter((f) => f?.kind === 'eyes').length / 60,
      chainSeconds: frames.filter((f) => f && f.kind !== 'eyes').length / 60,
      shots: frames.flatMap((frame, index) =>
        frame && frame.label !== frames[index - 1]?.label ? [{ second: index / 60, ...frame }] : [],
      ),
    },
  }
}
