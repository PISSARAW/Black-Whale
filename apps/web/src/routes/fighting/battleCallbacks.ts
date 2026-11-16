import { speakBattleWords } from '$lib/fighting/battleConversation'
import { performAuraAttack } from '$lib/fighting/engine'
import type { FightSide, FightState } from '$lib/fighting/types'

export function battleStageCallbacks(queue: (action: (state: FightState) => FightState) => void) {
  return {
    onTalk: (side: FightSide) => queue((state) => speakBattleWords(state, side)),
    onBattleAction: (side: FightSide, moveId: string) =>
      queue((state) =>
        performAuraAttack({ state, side, moveId, kind: 'special', auraCharged: false }),
      ),
  }
}
