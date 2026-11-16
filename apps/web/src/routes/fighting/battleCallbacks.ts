import { callHanzoBody } from '$lib/fighting/hanzoBodyCall'
import { observeFightCommand } from '$lib/fighting/commandFeedback'
import { speakBattleWords } from '$lib/fighting/battleConversation'
import { performAuraAttack } from '$lib/fighting/engine'
import type { FightSide, FightState } from '$lib/fighting/types'

export function battleStageCallbacks(queue: (action: (state: FightState) => FightState) => void) {
  return {
    onTalk: (side: FightSide) => queue((state) => speakBattleWords(state, side)),
    onBattleAction: (side: FightSide, moveId: string) =>
      queue((state) =>
        observeFightCommand(state, { side, action: 'special', moveId }, (current) =>
          performAuraAttack({ state: current, side, moveId, kind: 'special', auraCharged: false }),
        ),
      ),
  }
}

export function callFightBody(state: FightState): FightState {
  return observeFightCommand(state, { side: 'player', action: 'utility' }, (current) =>
    callHanzoBody(current, 'player'),
  )
}
