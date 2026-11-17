import { futureCanPrepare } from './parallelFutureAbility'
import type { FightSide, FightState } from './types'

export function visibleFutureBeastOwner(state: FightState, viewer: FightSide = 'player') {
  const future = state.parallelFuture
  if (!future || future.phase === 'preparing') return undefined
  return future.owner === viewer || state.mode === 'versus-local' || state.mode === 'training'
    ? future.owner
    : undefined
}

export function futureVisibleState(
  state: FightState,
  viewer: FightSide,
  previewIndex?: number | null,
): FightState {
  const future = state.parallelFuture
  if (!future || future.frames.length === 0) return state
  const preview = future.phase === 'vision' && viewer === future.owner
  const deceived = future.phase === 'diverging' && viewer !== future.owner
  if (!preview && !deceived) return state
  const index = preview ? (previewIndex ?? future.previewCursor) : Math.max(0, future.cursor - 1)
  const predicted = future.frames[index]
  return {
    ...state,
    enReadings: undefined,
    arena: predicted.arena,
    voconteDoors: predicted.voconteDoors,
    player: predicted.player,
    opponent: predicted.opponent,
    projectiles: predicted.projectiles,
    battlefield: predicted.battlefield,
    impact: predicted.impact,
    previousPositions: {
      player: { x: predicted.player.x, y: predicted.player.y },
      opponent: { x: predicted.opponent.x, y: predicted.opponent.y },
    },
  }
}

export function futureSpecialPresentation(state: FightState, language: 'fr' | 'en') {
  const future = state.parallelFuture
  const owns = future?.owner === 'player'
  const vision = owns && future.phase === 'vision'
  return {
    ready: owns || futureCanPrepare(state.player),
    label:
      language === 'fr'
        ? vision
          ? 'Ouvrir les yeux · Diverger'
          : 'Laplace Devil'
        : vision
          ? 'Open Eyes · Diverge'
          : 'Laplace Devil',
    hint:
      language === 'fr'
        ? 'L : Zetsu, yeux fermés et préparation vulnérable · Vision +10 s · L/H : diverger · aucune esquive automatique'
        : 'L: Zetsu, closed eyes and vulnerable preparation · +10 s vision · L/H: diverge · no automatic dodge',
  }
}
