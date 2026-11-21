import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from '../../src/lib/fighting/engine'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import { withKameos } from '../../src/lib/fighting/kameos/state'
import { nenStatus } from '../../src/lib/fighting/nen'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { Portrait } from './portraitCamera'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type FighterId,
  type MoveAction,
  type MoveSlot,
} from '../../src/lib/fighting/types'

export interface Beat {
  at: number
  word: string
  line: string
}
export interface ReelImpact {
  at: number
  attacker: FightSide
  damage: number
  critical: boolean
  /** A real contact stopped by the guard (Ken shots film these on purpose). */
  blocked?: boolean
}
export interface Segment {
  stage: FightStageId
  opponent: FighterId
  states: FightState[]
  beats: Beat[]
  impacts: ReelImpact[]
  /** Engine statuses actually observed on the hero during the segment (ten, ren, ko:hands…). */
  observed: string[]
  events: string[]
  /** Simulation frame ranges filmed by the portrait camera instead of the combat camera. */
  portraits: { from: number; to: number; mode: Portrait }[]
  /** Frames where the same continuous fight is cut to another stage. */
  splits: { at: number; stage: FightStageId }[]
  card?: 'title'
  /** Rendered through the live game scene (prediction panel of Laplace Devil, etc.). */
  live?: boolean
  /** One piece of a fight cut across stages: it may be as short as two beats. */
  part?: boolean
  /** Victory cinematic keys: from `at` on, the film plays from `elapsed` seconds. */
  victory?: { at: number; elapsed: number }[]
  /** The hero's own Nen creature, rising on him from `at` over `rise` frames. */
  companion?: { at: number; rise: number; model: import('./companion').Companion['model'] }
  /** The fighter the shot is about (videos with one hero per scene). */
  hero?: FighterId
  /** A second fight filmed in lockstep, shown at the same time in the lower half. */
  twin?: Segment
  /** Slow motion: below 1, every simulated frame stays longer on screen. */
  slow?: number
  /** A victory film variant the engine's own witness confirmed (Sun and Moon). */
  filmVariant?: { variant: 'chrollo-sun-moon'; duration: number }
  error?: string
}

type Input = Partial<FightInput>

/** Records every engine tick of one continuous shot; nothing here edits combat state by hand. */
export class Shot {
  state: FightState
  states: FightState[] = []
  beats: Beat[] = []
  impacts: ReelImpact[] = []
  observed = new Set<string>()
  events = new Set<string>()
  held: { player: Input; opponent: Input } = { player: {}, opponent: {} }
  portraits: Segment['portraits'] = []
  splits: Segment['splits'] = []
  card?: Segment['card']
  live?: boolean
  victory: NonNullable<Segment['victory']> = []
  filmVariant?: Segment['filmVariant']
  readonly hero: FighterId
  /** Set on a shot that shares the screen with another, cut on the same frames. */
  twin?: Shot
  companion?: Segment['companion']
  private sequence = -1

  constructor(
    readonly stage: FightStageId,
    readonly opponent: FighterId,
    options: {
      gap?: number
      centre?: number
      /** `true` prepares rooms and objects; an object passes its own scenario through. */
      preparation?: boolean | { resources: readonly string[]; cohorts: readonly FightSide[] }
      bookClosed?: boolean
      hero?: FighterId
      opponentAura?: number
      /** Real stage objects (crates) the fighters can use. */
      arena?: boolean
      /** Scenario start: a last round, so the finale's KO comes within one combo. */
      opponentHealth?: number
      /** Scenario start for the hero, when the scene is about the hero's own death. */
      heroHealth?: number
      /** Support kameos chosen before the fight, as on the preparation screen. */
      kameos?: Parameters<typeof withKameos>[1]
    } = {},
  ) {
    this.hero = options.hero ?? 'chrollo'
    const created = (state: FightState) =>
      options.kameos ? withKameos(state, options.kameos) : state
    const fresh = beginFight(
      created(createFight(options.hero ?? 'chrollo', opponent, {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: stage,
          ...(options.arena ? { arenaInteractions: true } : {}),
          ...(options.preparation
            ? {
                preparation: {
                  mode: 'scenario' as const,
                  ...(options.preparation === true
                    ? { resources: ['rooms', 'objects'] as const, cohorts: [] }
                    : options.preparation),
                },
              }
            : {}),
        },
      } as Parameters<typeof createFight>[2])),
    )
    const gap = options.gap ?? 8
    const centre = options.centre ?? 50
    this.state = {
      ...fresh,
      player: {
        ...fresh.player,
        x: centre - gap / 2,
        aura: 100,
        health: options.heroHealth ?? fresh.player.health,
        // Shots whose technique forces the book shut start with it already closed.
        ...(options.bookClosed && fresh.player.chrolloBook
          ? { chrolloBook: { ...fresh.player.chrolloBook, open: false } }
          : {}),
      },
      opponent: {
        ...fresh.opponent,
        x: centre + gap / 2,
        aura: options.opponentAura ?? 100,
        health: options.opponentHealth ?? fresh.opponent.health,
      },
    }
    this.states.push(this.state)
  }

  get frame() {
    return this.states.length - 1
  }
  /** Film the next `frames` simulation frames with the portrait camera. */
  portrait(mode: Portrait, frames: number, offset = 0) {
    this.portraits.push({ from: this.frame + offset, to: this.frame + offset + frames, mode })
  }
  /** Keep fighting, but show what follows on another stage. */
  /** From this frame on, the victory cinematic shows its own film from `elapsed` seconds. */
  film(elapsed: number) {
    this.victory.push({ at: this.frame, elapsed })
  }
  /** From this frame on, the hero's Nen creature rises on him over `rise` frames. */
  summon(model: NonNullable<Segment['companion']>['model'], rise = 40) {
    this.companion = { at: this.frame, rise, model }
  }
  cut(stage: FightStageId) {
    this.splits.push({ at: this.frame, stage })
  }
  beat(word: string, line = '') {
    this.beats.push({ at: this.frame, word, line })
  }
  step(count = 1, player: Input = {}, opponent: Input = {}) {
    for (let i = 0; i < count; i++) {
      this.state = tickFight(
        this.state,
        { ...EMPTY_INPUT, ...this.held.player, ...player },
        {
          dt: 1 / 60,
          ai: false,
          opponentInput: { ...EMPTY_INPUT, ...this.held.opponent, ...opponent },
        },
      )
      this.record()
    }
  }
  private record() {
    this.states.push(this.state)
    for (const s of nenStatus(this.state.player)) this.observed.add(s)
    const impact = this.state.impact
    if (!impact || impact.sequence === this.sequence) return
    this.sequence = impact.sequence
    if (impact.blocked)
      this.events.add(`blocked-by-${impact.attacker === 'player' ? 'opponent' : 'player'}`)
    if (impact.parried) return
    this.impacts.push({
      at: this.frame,
      attacker: impact.attacker,
      damage: impact.damage,
      critical: impact.critical,
      blocked: impact.blocked,
    })
  }
  /** A button press through the production command path. */
  press(action: MoveAction, input: Input = {}, side: FightSide = 'player') {
    this.state = performMove({
      state: this.state,
      side,
      action,
      input: { ...EMPTY_INPUT, ...this.held[side], ...input },
    })
    this.states[this.frame] = this.state
  }
  /** A named move by slot, as the Showcase director issues it (book, pages, specials). */
  move(slot: MoveSlot, input: Input = {}, side: FightSide = 'player') {
    const move = moveForSlot(this.state[side].id, slot)
    if (!move) throw new Error(`${this.state[side].id} has no ${slot}`)
    this.state = performAuraAttack({
      state: this.state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: Boolean(input.aura),
    })
    this.states[this.frame] = this.state
  }
  ranged(side: FightSide = 'player') {
    this.state = performAttack(this.state, side, 'ranged')
    this.states[this.frame] = this.state
  }
  arsenal(command: Parameters<typeof performArsenalCommand>[2]) {
    this.state = performArsenalCommand(this.state, 'player', command)
    this.states[this.frame] = this.state
  }
  /**
   * Walk toward the other fighter, like a player: stop at `gap`, or as soon as the bodies
   * touch. Walking on into a pushbox only makes both rigs strain in place.
   */
  approach(side: FightSide = 'player', gap = 5) {
    let stalled = 0
    let last = Math.abs(this.state.player.x - this.state.opponent.x)
    for (let i = 0; i < 120; i++) {
      const distance = Math.abs(this.state.player.x - this.state.opponent.x)
      if (distance <= gap) break
      stalled = last - distance < 0.04 && i > 0 ? stalled + 1 : 0
      if (stalled >= 3) break
      last = distance
      const other = side === 'player' ? 'opponent' : 'player'
      const dir = { [this.state[side].x < this.state[other].x ? 'right' : 'left']: true }
      this.step(1, side === 'player' ? dir : {}, side === 'opponent' ? dir : {})
    }
  }
  /** Wait for `count` new hits that land (a blocked contact is not a hit). */
  hits(count: number, attacker: FightSide = 'player', limit = 110) {
    const landed = () => this.impacts.filter((i) => i.attacker === attacker && !i.blocked).length
    const target = landed() + count
    for (let i = 0; i < limit; i++) {
      if (landed() >= target) return true
      this.step()
    }
    return false
  }
  /** Wait for the next contact of `attacker`, landed or blocked. */
  contact(attacker: FightSide, limit = 60) {
    const target = this.impacts.filter((i) => i.attacker === attacker).length + 1
    for (let i = 0; i < limit; i++) {
      if (this.impacts.filter((x) => x.attacker === attacker).length >= target) return true
      this.step()
    }
    return false
  }
  /** The opponent attacks for real, `count` times; every contact lands on the held guard. */
  pressure(count: number, onBlock: (n: number) => void = () => {}) {
    const actions = ['light', 'heavy', 'light', 'heavy', 'heavy'] as const
    let blocked = 0
    for (let i = 0; i < count; i++) {
      this.approach('opponent', 5)
      this.press(actions[i % actions.length], {}, 'opponent')
      if (this.contact('opponent', 50) && this.impacts.at(-1)?.blocked) onBlock(++blocked)
      this.idle('opponent', 30)
      this.step(4)
    }
    return blocked
  }
  idle(side: FightSide = 'player', limit = 120) {
    for (let i = 0; i < limit && this.state[side].attack; i++) this.step()
  }
  private scan() {
    for (let i = 1; i < this.states.length; i++) {
      const [a, b] = [this.states[i - 1], this.states[i]]
      if (b.opponent.hatsuEffects.sunMark && !a.opponent.hatsuEffects.sunMark)
        this.events.add('sun-mark')
      if (b.opponent.hatsuEffects.manipulatedFrames && !a.opponent.hatsuEffects.manipulatedFrames)
        this.events.add('black-voice')
      if (b.player.chrolloHistorical?.fish && !a.player.chrolloHistorical?.fish)
        this.events.add('indoor-fish')
      if (Math.abs(b.opponent.x - a.opponent.x) > 8) this.events.add('teleported')
      if (b.player.chrolloBook?.open === false && a.player.chrolloBook?.open)
        this.events.add(`book-closed@${i}`)
      if (b.player.nen.on && !a.player.nen.on) this.events.add('on')
      const [ka, kb] = [a.player.kurapika, b.player.kurapika]
      if (kb?.emperorTime && !ka?.emperorTime) this.events.add('emperor-time')
      if (kb?.held && !ka?.held) this.events.add(`stolen:${kb.held.moveId}`)
      if (b.opponent.chainJail && !a.opponent.chainJail) this.events.add('chain-jail')
      if (b.opponent.judgmentChain && !a.opponent.judgmentChain) this.events.add('judgment-chain')
      if (b.player.health > a.player.health) this.events.add('healed')
      if (b.bungeeGum && !a.bungeeGum) this.events.add('bungee-gum')
      if (a.bungeeGum && !b.bungeeGum) this.events.add('gum-consumed')
      if (b.bungeeGum?.retracting && !a.bungeeGum?.retracting) this.events.add('gum-recall')
      const [pa, pb] = [a.player.hatsuEffects.painPacker, b.player.hatsuEffects.painPacker]
      if (pb?.armour && !pa?.armour) this.events.add('pain-packer')
      if (pb?.sun && !pa?.sun) this.events.add('rising-sun')
      const [ha, hb] = [a.player.hatsuEffects, b.player.hatsuEffects]
      if (hb.cohortWillFrames >= 480 && ha.cohortWillFrames < 480) this.events.add('gathered-will')
      if (hb.arrowNocked && !ha.arrowNocked) this.events.add('arrow-nocked')
      if (b.player.halkenburgGroupProtection && !a.player.halkenburgGroupProtection)
        this.events.add('group-protection')
      if ((b.halkSoulLinks?.length ?? 0) > (a.halkSoulLinks?.length ?? 0))
        this.events.add('mind-transfer')
      if (b.player.id !== a.player.id) this.events.add(`new-body:${b.player.id}`)
      const sleeping = (x: FightState) => x.halkSoulMinds?.some((m) => m.sleep) ?? false
      if (sleeping(b) && !sleeping(a)) this.events.add('mind-sleep')
      const sedated = (x: FightState) =>
        (x.halkSoulLinks ?? []).some((l) => (l as { preparedSedative?: number }).preparedSedative)
      if (sedated(b) && !sedated(a)) this.events.add('sedative')
      if (b.player.umbrellaFeintFrames && !a.player.umbrellaFeintFrames) this.events.add('umbrella')
      const links = (x: FightState) => x.gumNetwork?.links?.length ?? 0
      if (links(b) > links(a)) this.events.add('gum-link')
      const crateMoved = b.battlefield?.entities.some((e) => {
        const before = a.battlefield?.entities.find((o) => o.id === e.id)
        return e.kind === 'crate' && before && Math.abs(before.x - e.x) > 0.5
      })
      if (crateMoved) this.events.add('crate-moved')
      if (b.player.textureSurprise && !a.player.textureSurprise) this.events.add('texture-surprise')
      const [ba, bb] = [a.player.hatsuEffects.baton, b.player.hatsuEffects.baton]
      if (bb?.markedTarget && !ba?.markedTarget) this.events.add('secret-window')
      if (bb?.card && !ba?.card) this.events.add('culdcept-card')
      if (ba?.card && !bb?.card) this.events.add('culdcept-release')
      const [fa, fb] = [a.parallelFuture?.phase, b.parallelFuture?.phase]
      if (fb && fb !== fa) this.events.add(`future:${fb}`)
      if (
        a.opponent.hatsuEffects.sunMark &&
        !b.opponent.hatsuEffects.sunMark &&
        b.opponent.health < a.opponent.health
      )
        this.events.add('sun-moon-detonation')
    }
  }
  segment(error?: string): Segment {
    this.scan()
    return {
      stage: this.stage,
      opponent: this.opponent,
      states: this.states,
      beats: this.beats,
      impacts: this.impacts,
      observed: [...this.observed].sort(),
      events: [...this.events].sort(),
      portraits: this.portraits,
      splits: this.splits,
      card: this.card,
      live: this.live,
      victory: this.victory.length ? this.victory : undefined,
      companion: this.companion,
      filmVariant: this.filmVariant,
      hero: this.hero,
      twin: this.twin?.segment(),
      error,
    }
  }
}
