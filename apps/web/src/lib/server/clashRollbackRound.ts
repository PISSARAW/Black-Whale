import { encodeFightSnapshot } from '$lib/fighting/fightReplaySnapshot'
import { EXPERIMENTAL_INPUT_DELAY } from '$lib/fighting/pvp/rollback/experimental'
import { IDLE_SEAT, type PvpSeatFrame } from '$lib/fighting/pvp/rollback/frameInput'
import type { FrameMessage } from '$lib/fighting/pvp/rollback/session'
import type { AuthoritativeClashMatch } from '$lib/fighting/pvp/serverMatch'
import type { FightSide } from '$lib/fighting/types'

const BUFFER_FRAMES = 64

/**
 * One epoch per fresh round or reconnection. Frames start at zero within an epoch. The
 * canonical match tick continues across epochs, and only authenticated inputs advance it.
 */
export class ClashRollbackRound {
  readonly initial: string
  frame = 0
  private readonly inputs = {
    player: new Map<number, PvpSeatFrame>(),
    opponent: new Map<number, PvpSeatFrame>(),
  }

  constructor(
    readonly epoch: number,
    private readonly match: AuthoritativeClashMatch,
  ) {
    this.initial = encodeFightSnapshot(match.snapshot())
  }

  receive(side: FightSide, inputs: FrameMessage[]) {
    const pending = this.inputs[side]
    if (inputs.some(({ frame }) => frame >= this.frame + BUFFER_FRAMES)) return false
    for (const { frame, seat } of inputs) {
      if (frame >= Math.max(this.frame, EXPERIMENTAL_INPUT_DELAY) && !pending.has(frame))
        pending.set(frame, seat)
    }
    return true
  }

  advance(limit: number) {
    let steps = 0
    while (steps < limit && this.match.phase === 'fighting') {
      const idle = this.frame < EXPERIMENTAL_INPUT_DELAY
      const player = idle ? IDLE_SEAT : this.inputs.player.get(this.frame)
      const opponent = idle ? IDLE_SEAT : this.inputs.opponent.get(this.frame)
      if (!player || !opponent) break
      this.match.advanceConfirmed({ player, opponent })
      this.inputs.player.delete(this.frame)
      this.inputs.opponent.delete(this.frame)
      this.frame++
      steps++
    }
    return steps
  }
}
