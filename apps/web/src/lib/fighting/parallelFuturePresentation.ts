import { futureCanPrepare } from './parallelFutureAbility'
import { futureGumState } from './bungeeForecast'
import { fieldDeceives } from './futureIllusion'
import type { FightSide, FightState } from './types'

export function visibleFutureBeastOwner(state: FightState, viewer: FightSide = 'player') {
  const owner = state.futureIllusion?.owner ?? visibleWindowOwner(state)
  return owner && canSeeFutureBeast(state, owner, viewer) ? owner : undefined
}
function visibleWindowOwner(state: FightState): FightSide | undefined {
  return state.parallelFuture?.phase !== 'preparing' ? state.parallelFuture?.owner : undefined
}
function canSeeFutureBeast(state: FightState, owner: FightSide, viewer: FightSide): boolean {
  return owner === viewer || state.mode === 'versus-local' || state.mode === 'training'
}

export function futureVisibleState(
  state: FightState,
  viewer: FightSide,
  previewIndex?: number | null,
): FightState {
  const future = state.parallelFuture
  const fieldView = fieldViewState(state, viewer)
  if (!future || future.frames.length === 0) return fieldView
  const preview = future.phase === 'vision' && viewer === future.owner
  const deceived = futureDeceives(state, viewer)
  if (!preview && !deceived) return fieldView
  const index = preview ? (previewIndex ?? future.previewCursor) : Math.max(0, future.cursor - 1)
  const predicted = future.frames[index]
  return {
    ...state,
    enReadings: undefined,
    ...futureGumState(predicted),
    arena: predicted.arena,
    voconteDoors: predicted.voconteDoors,
    player: predicted.player,
    opponent: predicted.opponent,
    projectiles: predicted.projectiles,
    battlefield: predicted.battlefield,
    rosterGuests: predicted.scene?.rosterGuests,
    impact: predicted.impact,
    previousPositions: {
      player: { x: predicted.player.x, y: predicted.player.y },
      opponent: { x: predicted.opponent.x, y: predicted.opponent.y },
    },
  }
}

function fieldViewState(state: FightState, viewer: FightSide): FightState {
  const field = state.futureIllusion
  return field && fieldDeceives(state, viewer)
    ? {
        ...state,
        [field.owner]: field.echo,
        projectiles: state.projectiles.filter((s) => !s.illusionHarmless),
      }
    : state
}
function futureDeceives(state: FightState, viewer: FightSide): boolean {
  const future = state.parallelFuture
  return (
    future?.phase === 'diverging' &&
    viewer !== future.owner &&
    (!state.futureIllusion || fieldDeceives(state, viewer))
  )
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
