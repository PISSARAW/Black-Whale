import {
  beginFight,
  createFight,
  performAttack,
  performAuraAttack,
  tickFight,
} from '../../src/lib/fighting/engine'
import { nenStatus } from '../../src/lib/fighting/nen'
import { applyAuraContext } from '../../src/lib/fighting/nen'
import type { FightStageId } from '../../src/lib/fighting/stages'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
  type FighterId,
} from '../../src/lib/fighting/types'

export interface DemoFrame {
  state: FightState
  chapter: number
  title: string
  subtitle: string
  tags: string[]
  chapterFrame: number
  card: 'intro' | 'outro' | null
}

/** The montage resets only at explicit chapter cuts. All in-shot actions use the game engine. */
export class Showcase {
  frameRate = 30
  frames: DemoFrame[] = []
  states: FightState[] = []
  audit: Array<Record<string, unknown>> = []
  techniques = new Set<string>()
  moves = new Set<string>()
  maxCombo = { player: 0, opponent: 0 }
  state!: FightState
  chapter = 0
  chapterStart = 0
  title = ''
  subtitle = ''
  tags: string[] = []
  card: DemoFrame['card'] = null

  cut(options: {
    title: string
    subtitle: string
    tags: string[]
    gap?: number
    card?: DemoFrame['card']
    player?: FighterId
    opponent?: FighterId
    stageId?: FightStageId
    ren?: boolean
  }) {
    this.chapter++
    this.chapterStart = this.states.length
    this.title = options.title
    this.subtitle = options.subtitle
    this.tags = options.tags
    this.card = options.card ?? null
    const fresh = beginFight(
      createFight(options.player ?? 'hisoka', options.opponent ?? 'chrollo', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { stageId: options.stageId ?? 'heavens-arena' },
      }),
    )
    const gap = options.gap ?? 8
    this.state = {
      ...fresh,
      player: { ...fresh.player, x: 50 - gap / 2, aura: 100 },
      opponent: { ...fresh.opponent, x: 50 + gap / 2, aura: 100 },
    }
    if (options.ren)
      for (const side of ['player', 'opponent'] as const)
        this.state[side] = applyAuraContext(this.state[side], { ...EMPTY_INPUT, aura: true })
    this.audit.push({ kind: 'cut', second: this.states.length / 60, title: this.title })
  }

  caption(title: string, subtitle: string, tags = this.tags) {
    this.title = title
    this.subtitle = subtitle
    this.tags = tags
  }

  step(count: number, player: Partial<FightInput> = {}, opponent: Partial<FightInput> = {}) {
    for (let index = 0; index < count; index++) {
      const before = this.state
      this.state = tickFight(
        this.state,
        { ...EMPTY_INPUT, ...player },
        {
          dt: 1 / 60,
          opponentInput: { ...EMPTY_INPUT, ...opponent },
        },
      )
      this.observe(before)
      this.states.push(this.state)
      if (this.states.length % (60 / this.frameRate) === 0)
        this.frames.push({
          state: this.state,
          chapter: this.chapter,
          title: this.title,
          subtitle: this.subtitle,
          tags: this.tags,
          chapterFrame: this.states.length - this.chapterStart,
          card: this.card,
        })
    }
  }

  observe(before: FightState) {
    for (const side of ['player', 'opponent'] as const) {
      nenStatus(this.state[side]).forEach((name) => this.techniques.add(name.split(':')[0]))
      this.maxCombo[side] = Math.max(
        this.maxCombo[side],
        this.state[side === 'player' ? 'opponent' : 'player'].comboHits,
      )
      const move = this.state[side].attack?.moveId
      if (move) this.moves.add(move)
    }
    if (this.state.impact?.sequence !== before.impact?.sequence && this.state.impact) {
      this.audit.push({
        second: this.states.length / 60,
        chapter: this.chapter,
        move: before[this.state.impact.attacker].attack?.moveId,
        ...this.state.impact,
        kind: 'impact',
      })
    }
    if (!before.bungeeGum && this.state.bungeeGum)
      this.audit.push({
        kind: 'gum-attached',
        second: this.states.length / 60,
        ...this.state.bungeeGum,
      })
    if (!before.player.textureSurprise && this.state.player.textureSurprise)
      this.audit.push({ kind: 'texture-surprise', second: this.states.length / 60 })
    if (
      before.player.hatsuEffects.sunMark > 0 &&
      this.state.player.hatsuEffects.sunMark === 0 &&
      before.player.hatsuEffects.moonMark === 0 &&
      this.state.player.health < before.player.health
    )
      this.audit.push({ kind: 'sun-moon-detonation', second: this.states.length / 60 })
    if (
      before.player.hatsuEffects.manipulatedFrames === 0 &&
      this.state.player.hatsuEffects.manipulatedFrames > 0
    )
      this.audit.push({ kind: 'black-voice', second: this.states.length / 60 })
  }

  move(side: FightSide, slot: MoveSlot, input: Partial<FightInput> = {}) {
    const move = moveForSlot(this.state[side].id, slot)!
    const before = this.state
    // Charge and concealment use the same aura intent as the production controls.
    this.state = performAuraAttack({
      state: this.state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: Boolean(input.aura),
    })
    this.audit.push({
      kind: 'command',
      second: this.states.length / 60,
      move: move.id,
      accepted: this.state !== before,
      buffered: Boolean(this.state[side].bufferedAttack),
    })
  }

  ranged(side: FightSide) {
    this.state = performAttack(this.state, side, 'ranged')
  }

  settle(count = 60, player: Partial<FightInput> = {}, opponent: Partial<FightInput> = {}) {
    this.step(count, player, opponent)
  }

  approach(side: FightSide, gap = 5) {
    for (let frame = 0; frame < 120; frame++) {
      if (Math.abs(this.state.player.x - this.state.opponent.x) <= gap) break
      const target = side === 'player' ? 'opponent' : 'player'
      const input = { [this.state[side].x < this.state[target].x ? 'right' : 'left']: true }
      this.step(1, side === 'player' ? input : {}, side === 'opponent' ? input : {})
    }
    this.step(1)
  }

  combo(side: FightSide, slots: MoveSlot[], inputs: Partial<FightInput> = {}) {
    this.approach(side)
    for (const slot of slots) {
      this.move(side, slot, inputs)
      for (let index = 0; index < 100; index++) {
        this.step(1, side === 'player' ? inputs : {}, side === 'opponent' ? inputs : {})
        if (this.state[side].attack?.confirmedHit && this.state.hitstop === 0) break
        if (!this.state[side].attack) break
      }
    }
    this.settle(65)
  }

  pad(seconds: number) {
    const remaining = Math.round(seconds * 60) - (this.states.length - this.chapterStart)
    if (remaining > 0) this.step(remaining)
  }

  report() {
    return {
      duration: this.states.length / 60,
      fps: this.frameRate,
      resolution: '1920x1080',
      source: 'Production fighting engine and FightScene, scripted local inputs; chapter resets.',
      techniques: [...this.techniques].sort(),
      moves: [...this.moves].sort(),
      maxCombo: this.maxCombo,
      audit: this.audit,
    }
  }
}
