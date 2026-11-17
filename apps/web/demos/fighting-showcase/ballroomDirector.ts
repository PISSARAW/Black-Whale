import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import type { FightProjectile, FightSide, FightState } from '../../src/lib/fighting/types'
import { StrategicDirector } from './strategicDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'

export class BallroomDirector extends StrategicDirector {
  close(side: FightSide, gap = 5.5) {
    super.close(side, gap)
  }
  execute(side: FightSide, slot: import('../../src/lib/fighting/types').MoveSlot, charged = false) {
    const move = moveForSlot(this.state[side].id, slot)!
    if (move.kind === 'light' || move.kind === 'heavy')
      this.until(() => canStartFighterAttack(this.state[side], move.kind, move.id))
    super.execute(side, slot, charged)
  }
  guarded(side: FightSide, slot: import('../../src/lib/fighting/types').MoveSlot) {
    const other = side === 'player' ? 'opponent' : 'player'
    this.close(side)
    this.until(() => this.free(side) && this.free(other))
    const f = this.state[other]
    this.held[other] =
      f.auraExhausted || f.aura < 15 ? { guard: true } : { guard: true, aura: true }
    this.advance(3)
    this.hit(side, slot)
    this.ready(side)
    this.held[other] = {}
  }
  prepareCard() {
    const card: FightProjectile = {
      id: 900,
      owner: 'player',
      fighterId: 'franklin',
      x: 50,
      y: 6.1,
      velocityX: 70,
      width: 0.6,
      height: 0.24,
      damage: 11,
      hitstun: 13,
      blockstun: 9,
      hitstop: 5,
      knockback: 2.2,
      targetZone: 'torso',
      shape: 'bullet',
      colour: '#ffffff',
      age: 0,
      lifetime: 120,
      matter: 'nen',
    }
    this.state.opponent.hatsuEffects.baton!.card = card
    this.audit.push({
      kind: 'prepared-culdcept-card',
      second: 0,
      source: 'Franklin Nen bullet captured before this duel',
    })
  }

  emperor() {
    this.ready('player')
    const before = this.state
    this.state = toggleEmperorTime(this.state, 'player')
    if (this.state.player.kurapika?.emperorTime && !before.player.kurapika?.emperorTime)
      this.audit.push({ kind: 'emperor-time-active', second: this.states.length / 60 })
    this.audit.push({
      kind: 'command',
      move: 'kurapika:emperor-time',
      second: this.states.length / 60,
      accepted: this.state !== before,
    })
    this.advance()
  }

  ko(side: FightSide) {
    this.close(side)
    this.ready(side)
    this.held[side] = { aura: true }
    this.advance(2)
    this.move(side, 'standingHeavy', { aura: true })
    this.advance(2)
    this.held[side] = {}
    this.until(() => !this.state[side].attack)
  }

  aerial(side: FightSide) {
    this.close(side)
    this.ready(side)
    const previous = this.held[side]
    this.held[side] = { ...this.direction(side), jump: true }
    this.advance(9)
    this.held[side] = {}
    if (side === 'player') this.execute(side, 'airLight')
    this.execute(side, 'airHeavy')
    this.held[side] = previous
  }

  observe(before: FightState) {
    super.observe(before)
    const current = this.state
    const emit = (kind: string, detail: Record<string, unknown> = {}) =>
      this.audit.push({ kind, second: this.states.length / 60, ...detail })
    if (
      !before.opponent.hatsuEffects.baton?.markedTarget &&
      current.opponent.hatsuEffects.baton?.markedTarget
    )
      emit('secret-window-mark')
    if (
      before.opponent.hatsuEffects.baton?.card &&
      !current.opponent.hatsuEffects.baton?.card &&
      current.projectiles.some((p) => p.owner === 'opponent')
    )
      emit('culdcept-replay')
    if (current.player.health > before.player.health)
      emit('holy-chain-heal', {
        amount: current.player.health - before.player.health,
        move: before.player.attack?.moveId,
      })
    if (!before.opponent.drainingChain && current.opponent.drainingChain)
      emit('steal-chain-attached')
    if (!before.player.kurapika?.held && current.player.kurapika?.held)
      emit('steal-chain-complete', { move: current.player.kurapika.held.moveId })
    if (!before.player.kurapika?.held?.loaded && current.player.kurapika?.held?.loaded)
      emit('stealth-dolphin-loaded')
    if (!before.opponent.judgmentChain && current.opponent.judgmentChain)
      emit('judgment-chain-attached')
    if (
      before.opponent.nen.on &&
      before.player.nen.ken &&
      current.impact?.sequence !== before.impact?.sequence &&
      current.impact?.blocked
    )
      emit('on-ken-block', { side: 'opponent' })
    if (!before.player.kurapika?.emperorTime && current.player.kurapika?.emperorTime)
      emit('emperor-time-active')
  }

  report() {
    const report = super.report()
    const sideTechniques = (side: FightSide) => [
      ...new Set(
        this.states.flatMap((state) => {
          const n = state[side].nen
          return [
            n.mode,
            ...(n.ken ? ['ken'] : []),
            ...(n.ko ? ['ko'] : []),
            ...(n.on ? ['on'] : []),
            ...(Object.values(n.ryu).some((v) => Number(v) > 0) && !n.on && !n.ko ? ['ryu'] : []),
          ]
        }),
      ),
    ]
    return {
      ...report,
      mangaInspired: false,
      ballroom: true,
      source:
        'One continuous Kurapika / Benjamin fight in the banquet ballroom; prepared Culdcept card; Holy Chain is the only health restoration.',
      initialRen:
        this.states[0].player.nen.mode === 'ren' && this.states[0].opponent.nen.mode === 'ren',
      techniquesBySide: { player: sideTechniques('player'), opponent: sideTechniques('opponent') },
      emperorTimeAtVictory: Boolean(this.state.player.kurapika?.emperorTime),
      emperorLifespanFrames: this.state.player.kurapika?.lifespanFrames,
      holyChainHeals: this.audit.filter((e) => e.kind === 'holy-chain-heal'),
      abilityEvents: this.audit.filter((e) =>
        [
          'secret-window-mark',
          'culdcept-replay',
          'steal-chain-attached',
          'steal-chain-complete',
          'stealth-dolphin-loaded',
          'judgment-chain-attached',
          'emperor-time-active',
        ].includes(String(e.kind)),
      ),
      chainJailExcluded: 'The target is not a Troupe member; using Chain Jail would kill Kurapika.',
      inheritedAbilities: this.state.opponent.hatsuEffects.baton?.inherited,
    }
  }
}
