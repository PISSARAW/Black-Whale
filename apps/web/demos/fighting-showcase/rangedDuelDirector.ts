import { ContinuousDirector } from './continuousDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, FightState, MoveSlot } from '../../src/lib/fighting/types'

export class RangedDuelDirector extends ContinuousDirector {
  close(side: FightSide, gap = 7.4) {
    super.close(side, gap)
  }
  execute(side: FightSide, slot: MoveSlot, charged = false) {
    if (this.state.phase !== 'fighting') return
    const move = moveForSlot(this.state[side].id, slot)!
    if (move.kind === 'light' || move.kind === 'heavy')
      this.until(() => canStartFighterAttack(this.state[side], move.kind, move.id))
    super.execute(side, slot, charged)
  }
  physical(side: FightSide, low = false) {
    if (this.state.phase !== 'fighting') return
    const other = side === 'player' ? 'opponent' : 'player'
    this.ready(other)
    this.held[other] = { aura: true, down: true }
    this.close(side)
    this.held[other] = {}
    this.advance()
    this.chain(side, low ? ['lowLight', 'forwardHeavy'] : ['standingLight', 'standingHeavy'])
  }
  distance(gap = 26) {
    this.ready('player')
    this.ready('opponent')
    this.held.opponent = { aura: true, down: true }
    this.until(() => {
      this.held.player = { ...this.direction('player', true), aura: true, down: true }
      return Math.abs(this.state.player.x - this.state.opponent.x) >= gap
    }, 150)
    this.held.player = {}
    this.held.opponent = {}
    this.advance()
    this.until(() => this.free('player') && this.free('opponent'))
  }
  fire(slot: MoveSlot = 'neutralSpecial', defence: 'hit' | 'guard' | 'jump' = 'hit') {
    this.distance()
    const health = this.state.player.health
    if (slot === 'forwardSpecial') this.ranged('opponent')
    else this.move('opponent', slot)
    this.advance(6)
    this.held.player =
      defence === 'guard'
        ? { guard: true }
        : defence === 'jump'
          ? { jump: true, ...this.direction('player') }
          : {}
    this.advance(defence === 'jump' ? 25 : 50)
    this.held.player = {}
    this.until(() => !this.state.opponent.attack && !this.state.projectiles.length, 180)
    this.audit.push({
      kind: 'bullet-exchange',
      second: this.states.length / 60,
      defence,
      damageTaken: health - this.state.player.health,
    })
  }
  remote(dodge = false) {
    this.distance(24)
    this.move('player', 'neutralSpecial')
    this.until(() => this.state.projectiles.some((p) => p.remotePunch))
    if (dodge) this.held.opponent = this.direction('opponent', true)
    this.advance(25)
    this.held.opponent = {}
    this.until(() => !this.state.player.attack && !this.state.projectiles.length)
    this.audit.push({
      kind: dodge ? 'remote-dodged' : 'remote-exchange',
      second: this.states.length / 60,
    })
  }
  finalCounter() {
    this.distance(26)
    this.move('player', 'neutralSpecial')
    this.advance(8)
    this.move('opponent', 'finisher')
    this.until(() => this.state.phase === 'finished', 180)
  }
  observe(before: FightState) {
    super.observe(before)
    for (const projectile of this.state.projectiles.filter(
      (p) => !before.projectiles.some((old) => old.id === p.id),
    ))
      this.audit.push({
        kind: projectile.remotePunch ? 'remote-launched' : 'bullet-launched',
        second: this.states.length / 60,
        id: projectile.id,
        owner: projectile.owner,
        gap: Math.abs(this.state.player.x - this.state.opponent.x),
      })
    const impact = this.state.impact
    if (!impact || impact.sequence === before.impact?.sequence || !impact.projectileId) return
    const projectile =
      before.projectiles.find((p) => p.id === impact.projectileId) ??
      this.state.projectiles.find((p) => p.id === impact.projectileId)
    if (projectile?.remotePunch)
      this.audit.push({
        kind: 'remote-impact',
        second: this.states.length / 60,
        blocked: impact.blocked,
        damage: impact.damage,
        targetX: projectile.remotePunch.targetX,
        actualX: this.state.opponent.x,
        interruptedMove: before.opponent.attack?.moveId,
        franklinShotsFired: before.opponent.attack?.projectilesSpawned ?? 0,
      })
  }
  report() {
    const base = super.report()
    return {
      ...base,
      rangedDuel: true,
      presentation: 'Resting Ten outline hidden for clarity; native Ren and Hatsu remain visible.',
      winner: this.state.winner,
      stageId: this.state.environment.stageId,
      initialHealth: this.states[0].player.maxHealth,
      remoteHits: this.audit.filter((e) => e.kind === 'remote-impact'),
      bulletExchanges: this.audit.filter((e) => e.kind === 'bullet-exchange'),
      projectilesEmitted: this.audit.filter((e) => e.kind === 'bullet-launched').length,
      rangedSeconds:
        this.states.filter(
          (s) => s.phase === 'fighting' && Math.abs(s.player.x - s.opponent.x) >= 20,
        ).length / 60,
      closeSeconds:
        this.states.filter(
          (s) => s.phase === 'fighting' && Math.abs(s.player.x - s.opponent.x) <= 10,
        ).length / 60,
      source:
        'One native Leorio / Franklin knockout duel in the princes’ burial chamber. No resource resets, healing, teleports or fabricated damage. Only initial health is extended.',
    }
  }
}
