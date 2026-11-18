import { beginFight, createFight } from '../../src/lib/fighting/engine'
import { displayedDocumentText } from '../../src/lib/fighting/paperTexture'
import type { FightSide, FightState } from '../../src/lib/fighting/types'

export function documentScenario(side: FightSide): FightState {
  const state = beginFight(
    createFight(side === 'player' ? 'hisoka' : 'theta', side === 'opponent' ? 'hisoka' : 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['documents'], cohorts: [] },
      },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: side === 'player' ? 26 : 32, aura: 100 },
    opponent: { ...state.opponent, x: side === 'opponent' ? 26 : 32, aura: 100 },
  }
}
export function documentSnapshot(state: FightState, side: FightSide) {
  const entry = state.battlefield!.entities.find(
    (entry) => entry.id === 'player:scenario-document',
  )!
  return {
    ink: entry.document!.text,
    appearance: displayedDocumentText(state, entry),
    reading: state[side].documentReading,
    draft: state[side].texturePaperDraft,
    holder: entry.document!.holder,
    layers: entry.document!.textures,
    attack: state[side].attack?.moveId,
  }
}
