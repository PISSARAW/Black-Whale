import { ownsBungeeGum } from './bungeeAccess'
import { performGumNetworkCommand } from './bungeeCommands'
import { ownedGumLinks, selectedGumLink, gumNetwork } from './bungeeNetwork'
import { gumCeilingHeight } from './bungeeGeometry'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

/** Uses the same paid preparations and real objects as the player. */
export function gumNetworkAi(state: FightState): FightState | null {
  if (!ownsBungeeGum(state.opponent) || state.frame < 90) return null
  const command =
    objectPlan(state) ?? overheadPlan(state) ?? limbPlan(state) ?? prepareCardPlan(state)
  if (!command) return null
  const next = performGumNetworkCommand(state, 'opponent', command)
  return next === state ? null : next
}
function objectPlan(state: FightState): ArsenalCommand | null {
  const object = aiObject(state)
  if (!object) return null
  const mode = object.shot.gumFlight?.mode
  if (mode !== 'held' && mode !== 'resting') return null
  if (selectedGumLink(state, 'opponent')?.id !== object.link.id)
    return { action: 'gum-select', target: String(object.link.id) }
  return { action: mode === 'held' ? 'gum-rethrow' : 'gum-recall' }
}
function aiObject(state: FightState) {
  const link = ownedGumLinks(state, 'opponent').find((entry) => entry.target.kind === 'projectile')
  if (link?.target.kind !== 'projectile') return null
  const id = link.target.id,
    shot = state.projectiles.find((entry) => entry.id === id)
  return shot ? { link, shot } : null
}
function overheadPlan(state: FightState): ArsenalCommand | null {
  const escape = ceilingEscape(state)
  if (escape) return escape
  const fighter = state.opponent
  if (!overheadOpening(state)) return null
  if (ownedGumLinks(state, 'opponent').some((entry) => entry.target.kind === 'surface')) return null
  const threatened = state.projectiles.some(
    (shot) => shot.owner === 'player' && Math.abs(shot.x - fighter.x) < 30,
  )
  return threatened && gumCeilingHeight(state) !== null
    ? { action: 'gum-anchor', target: 'ceiling' }
    : null
}
function ceilingEscape(state: FightState): ArsenalCommand | null {
  const fighter = state.opponent
  const link = selectedGumLink(state, 'opponent')
  if (link?.target.kind !== 'surface') return null
  if (fighter.y > 12 && state.frame % 90 < 15) return { action: 'gum-detach' }
  return link.motion === 'idle' && fighter.y < 5 ? { action: 'gum-propel' } : null
}
function limbPlan(state: FightState): ArsenalCommand | null {
  if (gumNetwork(state).limbs.opponent === 'foot-left') return null
  if (
    ownedGumLinks(state, 'opponent').length !== 1 ||
    Math.abs(state.opponent.x - state.player.x) > 12
  )
    return null
  return { action: 'gum-limb', target: 'foot-left' }
}
function overheadOpening(state: FightState): boolean {
  return state.opponent.y <= 8 && state.opponent.aura >= 35 && state.frame % 240 <= 20
}
function prepareCardPlan(state: FightState): ArsenalCommand | null {
  if (state.opponent.id !== 'hisoka' || state.opponent.gumThrowReady || state.opponent.aura < 25)
    return null
  if (ownedGumLinks(state, 'opponent').some((link) => link.target.kind === 'projectile'))
    return null
  return state.frame % 180 < 15 ? { action: 'gum-prepare-throw' } : null
}
