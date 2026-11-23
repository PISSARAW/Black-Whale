import { Shot } from '../fighting-chrollo-intro/reel'
import { performArsenalAction } from '../../src/lib/fighting/arsenalExecution'
import { performAttack, performAuraAttack } from '../../src/lib/fighting/engine'
import { playSignatureSteps } from '../../src/lib/fighting/signatureComboRunner'
import { signatureCombo, signatureHits } from '../../src/lib/fighting/signatureCombos'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FightSide } from '../../src/lib/fighting/types'

/**
 * One passage per attacker: the fighter on the offensive is the shot's player. Life and
 * aura carry over from the passage before, so the fight reads as one continuous duel.
 */
export type Duelist = 'hisoka' | 'chrollo'
export type Bars = Record<Duelist, { hp: number; aura: number }>
type Command = Parameters<typeof performArsenalAction>[0]['command']

export const other = (who: Duelist): Duelist => (who === 'hisoka' ? 'chrollo' : 'hisoka')

export function passage(who: Duelist, bars: Bars, place: { stage: FightStageId; gap: number }) {
  const foe = other(who)
  return new Shot(place.stage, foe, {
    hero: who,
    gap: place.gap,
    heroHealth: bars[who].hp,
    heroAura: bars[who].aura,
    opponentHealth: bars[foe].hp,
    opponentAura: bars[foe].aura,
    arena: true,
  })
}

/** Life and aura at the end of a passage, for the next one. */
export function settle(s: Shot, who: Duelist): Bars {
  const foe = other(who)
  return {
    [who]: { hp: s.state.player.health, aura: s.state.player.aura },
    [foe]: { hp: s.state.opponent.health, aura: s.state.opponent.aura },
  } as Bars
}

export const act = (s: Shot, command: Command, side: FightSide = 'player') => {
  s.state = performArsenalAction({ state: s.state, side, command }, performAuraAttack)
  s.states[s.frame] = s.state
}
export const special = (s: Shot) => {
  s.state = performAttack(s.state, 'player', 'special')
  s.states[s.frame] = s.state
}
const free = (s: Shot, side: FightSide) => {
  const f = s.state[side]
  return !f.hitStun && !f.knockdownFrames && !f.wakeupInvulnerableFrames && !f.attack
}
export const recover = (s: Shot, side: FightSide = 'opponent', limit = 150) => {
  for (let i = 0; i < limit && !free(s, side); i++) s.step()
}
export const until = (s: Shot, done: () => boolean, limit = 90) => {
  for (let i = 0; i < limit && !done(); i++) s.step()
}

/** A signature combo through the game's own route runner, every frame kept in the shot. */
export function signature(s: Shot, id: string, prepare = true) {
  const combo = signatureCombo(id)
  const onFrame = (state: typeof s.state) => s.adopt(state)
  if (prepare && combo.preparation) {
    const hits = combo.preparation.filter((step) => 'move' in step && step.hit !== false).length
    playSignatureSteps({ steps: combo.preparation, hits, dummy: { onFrame } }, s.state)
    recover(s, 'player')
    recover(s, 'opponent')
  }
  const run = playSignatureSteps(
    { steps: combo.steps, hits: signatureHits(combo).length, dummy: { onFrame } },
    s.state,
  )
  return run.reached >= combo.steps.length
}
