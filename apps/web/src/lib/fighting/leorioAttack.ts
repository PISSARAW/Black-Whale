import type { ArcadeFighter, AttackKind } from './types'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** Optional state from other fighters; the surface punch has no dependency on their modules. */
type RemoteCaster = ArcadeFighter & {
  hanzoProjection?: { bodyX: number }
  chrolloBook?: { pages: readonly string[]; page: number; open: boolean; bookmark: string | null }
}

export const LEORIO_REMOTE_MOVE = 'leorio:neutralSpecial'

/** Includes the page Chrollo can replay, but none of his other book techniques. */
export function usesRemotePunch(fighter: RemoteCaster): boolean {
  return fighter.attack?.kind === 'special' && fighter.attack.hatsuSource === 'leorio'
}

export function remotePunchIntent(
  fighter: RemoteCaster,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (fighter.id === 'leorio') return kind === 'special' || kind === 'ranged'
  return kind === 'special' && fighter.id === 'chrollo' && copiedPage(fighter, moveId) === 'leorio'
}

function copiedPage(fighter: RemoteCaster, moveId?: string): string | null {
  const book = fighter.chrolloBook
  if (moveId === 'chrollo:finisher') return book?.bookmark ?? null
  if (moveId !== 'chrollo:neutralSpecial') return null
  if (!book) return fighter.hatsuEffects.stolenHatsu
  return book.open ? (book.pages[book.page] ?? null) : book.bookmark
}

export function remotePunchTargetX(fighter: RemoteCaster): number {
  return fighter.hanzoProjection?.bodyX ?? fighter.x
}

export function remotePunchGrounded(fighter: RemoteCaster): boolean {
  return fighter.y === 0 && !fighter.hanzoProjection && !fighter.motion?.prejumpFrames
}

export function remotePunchAvailable(
  fighter: RemoteCaster,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (!remotePunchIntent(fighter, kind, moveId)) return true
  return (
    remotePunchGrounded(fighter) &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.hatsuEffects.forcedZetsuFrames === 0
  )
}

/** U is an alias, with exactly the same cost, restrictions and animation as L. */
export function performLeorioAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const fighter = options.state[options.side]
  if (fighter.id !== 'leorio') return null
  if (options.kind === 'ranged')
    return perform({ ...options, kind: 'special', moveId: LEORIO_REMOTE_MOVE, variant: 'standing' })
  if (options.kind !== 'special') return null
  if (!options.moveId)
    return perform({ ...options, moveId: LEORIO_REMOTE_MOVE, variant: 'standing' })
  return options.moveId === LEORIO_REMOTE_MOVE ? null : options.state
}
