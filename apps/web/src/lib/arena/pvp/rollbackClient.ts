import { combatReducer } from '../../combat/reducer'
import type { CombatSide, CombatState } from '../../combat/types'
import { stateChecksum } from '../replay/checksum'
import type { ArenaPvpCommand, ArenaPvpView } from './transport'
import type { NetworkAction } from './serverMatch'

export interface ArenaRollbackStats {
  rollbacks: number
  replayedCommands: number
  longestReplay: number
}

export interface ArenaRollbackResult {
  accepted: boolean
  state: CombatState | null
  rolledBack: boolean
  replayed: number
}

/**
 * Client prediction over authoritative HTTP snapshots.
 *
 * The server remains the only clock and referee. Local commands are applied at
 * once, then replayed over every newer snapshot until `nextSequence` confirms
 * them. No remote command or tick is invented by the client.
 */
export class ArenaRollbackClient {
  readonly stats: ArenaRollbackStats = { rollbacks: 0, replayedCommands: 0, longestReplay: 0 }
  private acknowledged = 0
  private revision = -1
  private pending: ArenaPvpCommand[] = []
  private authoritative: CombatState | null = null
  private predicted: CombatState | null = null

  constructor(private readonly side: CombatSide) {}

  get state(): CombatState | null {
    return this.predicted
  }

  get pendingCommands(): number {
    return this.pending.length
  }

  predict(action: NetworkAction): ArenaPvpCommand | null {
    if (!this.predicted || this.predicted.outcome !== 'playing' || action.side !== this.side)
      return null
    const command = { sequence: this.acknowledged + this.pending.length, action }
    this.pending.push(command)
    this.predicted = combatReducer(this.predicted, action)
    return command
  }

  receive(view: ArenaPvpView): ArenaRollbackResult {
    const snapshot = view.snapshot
    if (view.side !== this.side) return this.result(false, false, 0)
    if (!snapshot) return this.result(true, false, 0)
    if (this.stale(view)) return this.result(false, false, 0)
    const hadPrediction = this.pending.length > 0
    const previous = this.predicted ? stateChecksum(this.predicted) : null
    this.acknowledged = view.nextSequence
    this.revision = snapshot.revision
    this.authoritative = snapshot.state
    this.pending = this.pending.filter(({ sequence }) => sequence >= this.acknowledged)
    this.predicted = this.replay(snapshot.state)
    const replayed = this.pending.length
    const rolledBack = hadPrediction && previous !== stateChecksum(this.predicted)
    if (rolledBack) this.recordRollback(replayed)
    return this.result(true, rolledBack, replayed)
  }

  reject(sequence: number): void {
    this.pending = this.pending.filter((command) => command.sequence < sequence)
    if (this.authoritative) this.predicted = this.replay(this.authoritative)
  }

  private stale(view: ArenaPvpView): boolean {
    if (view.nextSequence < this.acknowledged) return true
    return (
      view.nextSequence === this.acknowledged && (view.snapshot?.revision ?? -1) < this.revision
    )
  }

  private replay(state: CombatState): CombatState {
    return this.pending.reduce((current, command) => combatReducer(current, command.action), state)
  }

  private recordRollback(replayed: number): void {
    this.stats.rollbacks += 1
    this.stats.replayedCommands += replayed
    this.stats.longestReplay = Math.max(this.stats.longestReplay, replayed)
  }

  private result(accepted: boolean, rolledBack: boolean, replayed: number): ArenaRollbackResult {
    return { accepted, state: this.predicted, rolledBack, replayed }
  }
}
