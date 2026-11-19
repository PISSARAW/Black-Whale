import { beginFight, createFight, performMove, tickFight } from '../../src/lib/fighting/engine'
import { prepareCombatRoute, type CombatRouteSetup } from '../../src/lib/fighting/combatRouteSetup'
import { WAKEUP_LESSONS } from '../../src/lib/fighting/wakeupLessons'
import { fighterDefinition } from '../../src/lib/fighting/roster'
import { moveById, moveForSlot } from '../../src/lib/fighting/movesets'
import { auraConcentration } from '../../src/lib/fighting/nenConcentration'
import type { DirectionalEnding } from '../../src/lib/fighting/directionalChain'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightNenZone,
  type FightState,
  type FighterId,
} from '../../src/lib/fighting/types'

export interface ComboImpact {
  at: number
  damage: number
  critical: boolean
  knockdown: boolean
  hits: number
}
export interface ComboPress {
  at: number
  key: string
  technique: 'ko' | 'ryu'
}
export interface ComboClip {
  id: FighterId
  name: string
  ending: DirectionalEnding
  finish: string
  signature: boolean
  states: FightState[]
  impacts: ComboImpact[]
  presses: ComboPress[]
  damage: number
  hits: number
  koFrames: number
  ryuFrames: number
}

/** Same resources the roster test grants to the techniques reached by a directional finish. */
const SETUP: Partial<Record<FighterId, CombatRouteSetup>> = {
  hisoka: 'bungee',
  biscuit: 'true-form',
  kalluto: 'paper',
}
const KEYS: Record<DirectionalEnding, string> = {
  ground: '↓ J',
  air: '↑ J',
  close: '← J',
  carry: '→ J',
}

function opening(id: FighterId): FightState {
  const pair = WAKEUP_LESSONS.find((l) => l.fighter === id && l.id.endsWith(':wakeup-sweep'))
  const opponent = pair?.wakeup ?? (id === 'chrollo' ? 'hisoka' : 'chrollo')
  let state = beginFight(createFight(id, opponent, { mode: 'versus-local', formatId: 'knockout' }))
  state = {
    ...state,
    player: { ...state.player, x: 44, aura: 100, facing: 1 },
    opponent: { ...state.opponent, x: 50, facing: -1 },
  }
  return prepareCombatRoute(state, SETUP[id])
}

const FOCUS: Record<FightNenZone, keyof FightInput> = {
  head: 'focusHead',
  torso: 'focusTorso',
  hands: 'focusHands',
  feet: 'focusFeet',
}

class Take {
  states: FightState[] = []
  impacts: ComboImpact[] = []
  presses: ComboPress[] = []
  focus: Partial<FightInput> = {}
  sequence: number
  constructor(public state: FightState) {
    this.sequence = state.impact?.sequence ?? -1
    this.states.push(state)
  }
  tick(count = 1) {
    for (let i = 0; i < count; i++) {
      this.state = tickFight(
        this.state,
        { ...EMPTY_INPUT, ...this.focus },
        { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT },
      )
      this.record()
    }
  }
  private record() {
    this.states.push(this.state)
    const impact = this.state.impact
    if (!impact || impact.sequence === this.sequence) return
    this.sequence = impact.sequence
    if (impact.attacker !== 'player' || impact.blocked || impact.parried) return
    this.impacts.push({
      at: this.states.length - 1,
      damage: impact.damage,
      critical: impact.critical,
      knockdown: impact.knockdown,
      hits: impact.comboHits,
    })
  }
  clone(): Take {
    const copy = new Take(this.state)
    copy.states = [...this.states]
    copy.impacts = [...this.impacts]
    copy.presses = [...this.presses]
    copy.focus = { ...this.focus }
    copy.sequence = this.sequence
    return copy
  }
  press(
    input: Partial<FightInput>,
    label: Omit<ComboPress, 'at'> & { action?: 'light' | 'heavy' },
  ) {
    const { key, technique, action = 'light' } = label
    this.state = performMove({
      state: this.state,
      side: 'player',
      action,
      input: { ...EMPTY_INPUT, ...this.focus, ...input },
    })
    this.presses.push({ at: this.states.length - 1, key, technique })
    this.states[this.states.length - 1] = this.state
  }
  /** Ryu: the player holds the zone of the limb that is about to strike. */
  hold(slot: Parameters<typeof moveForSlot>[1]) {
    const zone = moveForSlot(this.state.player.id, slot)?.tuning.auraZone
    this.focus = zone ? { [FOCUS[zone]]: true } : {}
  }
  waitHits(count: number) {
    for (let i = 0; i < 110 && this.impacts.length < count; i++) this.tick()
    if (this.impacts.length < count) throw new Error(`only ${this.impacts.length}/${count} hits`)
  }
}

/**
 * A Ko strike only follows when the engine lets it connect: a Ko on the first J is a
 * critical knockdown that ends the chain, so Ko is tried after the directional finish.
 */
function koFollowUp(base: Take): Take | null {
  for (const action of ['heavy', 'light'] as const)
    for (let delay = 0; delay < 40; delay += 2) {
      const take = base.clone()
      take.focus = {}
      take.tick(delay)
      const before = take.state.player.attack
      take.press(
        { aura: true },
        { key: action === 'heavy' ? 'Ko K' : 'Ko J', technique: 'ko', action },
      )
      const started = take.state.player.attack
      if (!started || started === before || !started.auraCharged) continue
      for (let i = 0; i < 50 && take.impacts.length < 4; i++) take.tick()
      if (take.impacts.length === 4 && take.impacts[3].hits >= 4) return take
    }
  return null
}

const FINISH_SLOT = {
  ground: 'lowHeavy',
  air: 'standingHeavy',
  close: 'backHeavy',
  carry: 'forwardHeavy',
} as const

/** J (Ko) → J (Ryu) → direction + J (Ryu), entered through performMove like a player. */
export function jCombo(id: FighterId, ending: DirectionalEnding): ComboClip {
  const take = new Take(opening(id))
  take.tick(14)
  take.hold('standingLight')
  take.press({}, { key: 'J', technique: 'ryu' })
  take.waitHits(1)
  take.hold('forwardLight')
  take.press({}, { key: 'J', technique: 'ryu' })
  take.waitHits(2)
  take.hold(FINISH_SLOT[ending])
  take.press(
    {
      down: ending === 'ground',
      jump: ending === 'air',
      right: ending === 'carry',
      left: ending === 'close',
    },
    { key: KEYS[ending], technique: 'ryu' },
  )
  const chained = take.state.player.attack
  if (chained?.directionalChain !== ending) throw new Error(`${ending} chain not accepted`)
  const finishMove = moveById(chained.moveId)
  take.waitHits(3)
  const extended = koFollowUp(take)
  const final = extended ?? take
  final.focus = {}
  for (let i = 0; i < 170; i++) {
    final.tick()
    const p = final.state.player
    if (i > 46 && !p.attack && final.state.opponent.y <= 0 && final.state.opponent.hitStun === 0)
      break
  }
  const concentration = final.states.map((s) => auraConcentration(s.player)?.technique)
  const start = Math.max(0, final.presses[0].at - 8)
  const shift = <T extends { at: number }>(list: T[]) =>
    list.map((e) => ({ ...e, at: e.at - start }))
  return {
    id,
    name: fighterDefinition(id).name,
    ending,
    finish: finishMove?.nameFr ?? '',
    signature: Boolean(finishMove && !finishMove.slot.endsWith('Heavy')),
    states: final.states.slice(start),
    impacts: shift(final.impacts),
    presses: shift(final.presses),
    damage: final.states[0].opponent.health - final.state.opponent.health,
    hits: Math.max(...final.impacts.map((i) => i.hits)),
    koFrames: concentration.filter((t) => t === 'ko').length,
    ryuFrames: concentration.filter((t) => t === 'ryu').length,
  }
}
