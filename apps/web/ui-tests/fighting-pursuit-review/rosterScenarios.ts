import { airPursuitTechnique } from '$lib/fighting/airPursuitTechniques'
import { prepareCombatRoute, type CombatRouteSetup } from '$lib/fighting/combatRouteSetup'
import { beginFight, createFight, performMove } from '$lib/fighting/engine'
import { moveById } from '$lib/fighting/movesets'
import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
import { performHunterInterview } from '$lib/fighting/skillHunterAcquisition'
import { EMPTY_INPUT, type FightState, type FighterId } from '$lib/fighting/types'
import { followPursuit, launch, prepare, step } from './scenarios'

export const rosterPursuitIds = [
  'hisoka',
  'kurapika',
  'franklin',
  'biscuit',
  'phinks',
  'chrollo',
  'bonolenov',
  'kalluto',
  'hanzo',
  ...FIGHTING_ROSTER.map(({ id }) => id).filter(
    (id) =>
      ![
        'hisoka',
        'kurapika',
        'franklin',
        'biscuit',
        'phinks',
        'chrollo',
        'bonolenov',
        'kalluto',
        'hanzo',
      ].includes(id),
  ),
] as FighterId[]

const CORNER = new Set<FighterId>([
  'chrollo',
  'bonolenov',
  'kalluto',
  'hanzo',
  'theta',
  'feitan',
  'shizuku',
  'gel',
  'longhi',
  'padaille',
  'leorio',
])
const PREP: Partial<Record<FighterId, CombatRouteSetup>> = {
  hisoka: 'bungee',
  machi: 'tracking',
  biscuit: 'true-form',
  phinks: 'cyclotron',
  bonolenov: 'prologue',
  kalluto: 'paper',
}
const PREMISES: Partial<Record<FighterId, string>> = {
  hisoka: 'Lien sur la cible · 55 aura',
  kurapika: 'Chaîne divinatoire · 24 aura',
  chrollo: 'Page de Gel acquise et ouverte',
  biscuit: 'Vraie forme active',
  phinks: 'Rotation chargée',
  bonolenov: 'Prologue joué',
  kalluto: 'Papier implanté',
  hanzo: 'Double actif · Corps exposé',
  machi: 'Aiguille de repérage posée',
  theta: 'Tir physique',
  feitan: 'Estoc physique',
  franklin: 'Double Machine Gun',
}
type RouteOptions = { corner: boolean; special: boolean; offset?: number }

export function rosterPursuit(id: FighterId) {
  const corner = CORNER.has(id)
  if (airPursuitTechnique(id) || id === 'chrollo') {
    for (const atCorner of [corner, !corner]) {
      const technique = attempt(id, { corner: atCorner, special: true })
      if (technique && confirmed(technique)) return technique
    }
  }
  const light = attempt(id, { corner, special: false })
  if (!light || !confirmed(light)) throw new Error(`${id} ne confirme pas la poursuite légère`)
  return light
}

export function cornerRecovery() {
  const route = attempt('camilla', { corner: true, special: false, offset: 10 })
  if (!route || route.winner !== 'opponent' || route.opening < 0)
    throw new Error('Reprise au coin absente')
  return route
}

function confirmed(result: NonNullable<ReturnType<typeof attempt>>) {
  return result.winner === 'player' && result.opening < 0 && result.hits >= 4
}

function attempt(id: FighterId, options: RouteOptions) {
  const { corner, special, offset = 0 } = options
  const states: FightState[] = [position(start(id, options), corner)]
  const command = launch(states)
  const launchFrame = states.length - 1
  const result = followPursuit(states, offset, special ? 'special' : 'light')
  if (!result) return null
  const contact = states[result.contact]
  const move = states
    .slice(launchFrame)
    .find((state) => state.player.attack?.directionalChain?.startsWith('pursuit'))?.player.attack
  const moveId = move?.moveId ?? null
  const hits = contact.impact?.comboHits ?? 0
  const impacts = contactLog(states)
  for (let f = 0; f < 18; f++) states.push(step(states.at(-1)!))
  return {
    states,
    id,
    command,
    launch: launchFrame,
    ...result,
    corner,
    hits,
    impacts,
    moveId,
    name: fighterDefinition(id).name,
    technique: moveById(moveId ?? undefined)?.nameFr ?? 'Poursuite légère',
    condition: special ? PREMISES[id] : 'Léger aérien',
    special: move?.directionalChain === 'pursuit-technique',
  }
}

function position(state: FightState, corner: boolean) {
  return {
    ...state,
    impact: null,
    player: { ...state.player, x: corner ? 87 : 44 },
    opponent: { ...state.opponent, x: corner ? 93 : 50 },
  }
}

function start(id: FighterId, { corner, special }: RouteOptions) {
  const rival = id === 'kurapika' ? 'hisoka' : id === 'chrollo' && special ? 'gel' : 'kurapika'
  const start = beginFight(createFight(id, rival, { mode: 'versus-local' }))
  const trial = position({ ...start, player: { ...start.player, aura: 100 } }, corner)
  if (id === 'hanzo') {
    const x = corner ? 76 : 37
    return prepare({ ...trial, player: { ...trial.player, x } })
  }
  if (!special) return trial
  if (id === 'chrollo') return acquireGelPage(position(start, false))
  return prepareCombatRoute(trial, PREP[id])
}

function acquireGelPage(state: FightState) {
  let showing = performMove({
    state,
    side: 'opponent',
    action: 'special',
    input: { ...EMPTY_INPUT, left: true },
  })
  for (let f = 0; f < 90; f++) showing = step(showing)
  const face = position(showing, false)
  const asked = performHunterInterview(face, 'player', { action: 'hunter-ask' })
  const answered = performHunterInterview(asked, 'opponent', { action: 'hunter-answer' })
  return performHunterInterview(answered, 'opponent', { action: 'hunter-palm' })
}

function contactLog(states: FightState[]) {
  return states.flatMap((state, index) => {
    if (!state.impact || state.impact.sequence === states[index - 1]?.impact?.sequence) return []
    return [{ index, side: state.impact.attacker, hits: state.impact.comboHits }]
  })
}
