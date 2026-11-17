import { troupeMember } from '../troupeMembership'
import type { VictoryDriver } from './types'
import { createKurapikaJailVictory } from './kurapikaJail'
import { createKurapikaJudgmentVictory } from './kurapikaJudgment'

export function createKurapikaVictory(): VictoryDriver {
  const jail = createKurapikaJailVictory(),
    judgment = createKurapikaJudgmentVictory()
  return {
    update(context) {
      const spider = troupeMember(context.state[context.frame.loser].id)
      if (spider) jail.update(context)
      else judgment.update(context)
    },
    dispose() {
      jail.dispose()
      judgment.dispose()
    },
  }
}
