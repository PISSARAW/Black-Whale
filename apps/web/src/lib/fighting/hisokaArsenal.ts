import { ownsBungeeGum, gumLoanUsed, spendGumUse } from './bungeeAccess'
export { ownsBungeeGum, spendGumUse } from './bungeeAccess'
import { NETWORK_GUM_ACTIONS, performGumNetworkCommand } from './bungeeCommands'
import { newGumSource, gumSourceCommandAllowed, sameGumSource } from './bungeeSource'
import { gumSupportAvailable, gumSupportLive } from './hisokaSupportOrigin'
import { canAct } from './fightActorState'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'

export function performGumCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (NETWORK_GUM_ACTIONS.some((action) => action === command.action))
    return performGumNetworkCommand(state, side, command)
  const fighter = state[side]
  if (command.action === 'gum-release') return releaseGumCatch(state, side)
  if (command.action === 'gum-unseal') return removeGumSeals(state, side)
  if (!ownsBungeeGum(fighter) || !gumBodyFree(fighter)) return state
  if (command.action === 'gum-return') return returnCaughtObject(state, side)
  if (gumLoanUsed(fighter)) return state
  return command.action === 'gum-seal' ? sealGumWounds(state, side) : prepareGumCatch(state, side)
}

function prepareGumCatch(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (fighter.aura < 12 || fighter.gumCatch?.projectile) return state
  const paid = spendGumUse(state, side, 12)
  return {
    ...paid,
    [side]: {
      ...paid[side],
      arenaRecovery: 24,
      gumCatch: { frames: 24, hidden: fighter.nen.in, ...newGumSource(fighter) },
      blocking: false,
    },
  }
}
function removeGumSeals(state: FightState, side: FightSide): FightState {
  if (!state[side].gumWoundSeals) return state
  return {
    ...state,
    [side]: { ...state[side], gumWoundSeals: undefined, gumWoundOrigin: undefined },
  }
}
function gumBodyFree(fighter: ArcadeFighter): boolean {
  return canAct(fighter) && !fighter.attack && !fighter.hanzoProjection
}

function sealGumWounds(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const wounds = fighter.openWounds ?? 0
  const origin = newGumSource(fighter)
  if (fighter.gumWoundOrigin && !sameGumSource(fighter.gumWoundOrigin, origin)) return state
  if (fighter.aura < 10 || wounds <= (fighter.gumWoundSeals ?? 0)) return state
  const paid = spendGumUse(state, side, 10)
  return {
    ...paid,
    [side]: { ...paid[side], gumWoundSeals: wounds, gumWoundOrigin: origin, arenaRecovery: 18 },
  }
}

function returnCaughtObject(state: FightState, side: FightSide): FightState {
  const fighter = state[side],
    shot = fighter.gumCatch?.projectile
  if (!shot || fighter.aura < 5) return state
  if (
    !gumSupportAvailable(fighter, fighter.gumCatch) ||
    !gumSourceCommandAllowed(fighter, fighter.gumCatch!)
  )
    return state
  const projectile = {
    ...shot,
    id: state.nextProjectileId,
    owner: side,
    fighterId: fighter.id,
    x: fighter.x + fighter.facing * 3,
    y: fighter.y + 6,
    velocityX: (fighter.gumCatch!.incomingSpeed ?? Math.abs(shot.velocityX)) * fighter.facing,
    gumFlight: undefined,
    velocityY: undefined,
    age: 0,
  }
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [...state.projectiles, projectile],
    [side]: { ...fighter, aura: fighter.aura - 5, gumCatch: undefined, arenaRecovery: 18 },
  }
}

export function advanceGumArsenal(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const fighter = next[side]
    if (!hasGumSupport(fighter)) continue
    const sealsActive = gumSupportLive(next, side, fighter.gumWoundOrigin)
    const catchActive = gumSupportLive(next, side, fighter.gumCatch)
    next = {
      ...next,
      [side]: {
        ...fighter,
        gumWoundSeals: sealsActive ? fighter.gumWoundSeals : undefined,
        gumWoundOrigin: sealsActive ? fighter.gumWoundOrigin : undefined,
        gumThrowReady: gumSupportLive(next, side, fighter.gumThrowReady)
          ? fighter.gumThrowReady
          : undefined,
        gumCatch: maintainGumCatch(fighter.gumCatch, catchActive),
      },
    }
  }
  return next
}

function maintainGumCatch(caught: ArcadeFighter['gumCatch'], active: boolean) {
  return caught
    ? {
        ...caught,
        frames: active ? Math.max(0, caught.frames - 1) : 0,
        released: active ? caught.released : true,
      }
    : undefined
}

export function gumArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsBungeeGum(state[side]) && !state[side].gumWoundSeals) return []
  const commands = [
    {
      action: 'gum-seal' as const,
      fr: 'Bungee Gum · Colmater les plaies',
      en: 'Bungee Gum · Seal wounds',
      condition: [
        'Arrête les saignements des plaies couvertes, sans soin ni restitution de PV.',
        'Stops bleeding from covered wounds, without healing or restoring HP.',
      ],
    },
    {
      action: 'gum-catch' as const,
      fr: 'Bungee Gum · Préparer une interception',
      en: 'Bungee Gum · Prepare a catch',
      condition: [
        'Fenêtre vulnérable et contact frontal avec un objet physique, y compris une copie matérialisée ; aucun faisceau d’aura. La force reçue peut blesser les mains.',
        'Vulnerable window and frontal contact with a physical object, including a conjured copy; no aura beam. The received force can injure the hands.',
      ],
    },
    {
      action: 'gum-return' as const,
      fr: 'Bungee Gum · Renvoyer l’objet retenu',
      en: 'Bungee Gum · Return the held object',
      condition: [
        'Réutilise uniquement l’objet réellement intercepté.',
        'Reuses only the object actually caught.',
      ],
    },
    {
      action: 'gum-release' as const,
      fr: 'Bungee Gum · Détacher l’objet de l’aura',
      en: 'Bungee Gum · Detach the object from aura',
      condition: [
        'L’objet réel reste tenu en main ; la technique est terminée.',
        'The real object remains in hand; the technique ends.',
      ],
    },
    {
      action: 'gum-unseal' as const,
      fr: 'Bungee Gum · Retirer les pansements',
      en: 'Bungee Gum · Remove seals',
      condition: [
        'Les blessures restent ouvertes après retrait du Nen.',
        'Wounds remain open after the Nen is removed.',
      ],
    },
  ]
  return commands.map((entry) => ({
    command: { action: entry.action },
    labelFr: entry.fr,
    labelEn: entry.en,
    conditionFr: entry.condition[0],
    conditionEn: entry.condition[1],
    ready: performGumCommand(state, side, { action: entry.action }) !== state,
  }))
}

function hasGumSupport(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.gumCatch || fighter.gumWoundSeals || fighter.gumThrowReady)
}

function releaseGumCatch(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!fighter.gumCatch || fighter.gumCatch.released) return state
  return {
    ...state,
    [side]: { ...fighter, gumCatch: { ...fighter.gumCatch, frames: 0, released: true } },
  }
}
