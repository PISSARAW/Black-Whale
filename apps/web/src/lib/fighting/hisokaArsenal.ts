import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { chainAbilityGroup } from './chainAbilityGroup'
import { chrolloHasActivePage } from './chrolloBook'
import { canAct } from './fightActorState'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'

export function ownsBungeeGum(fighter: ArcadeFighter): boolean {
  if (!voluntaryNenAvailable(fighter) || chainAbilitySealed(fighter, 'hisoka:neutralSpecial'))
    return false
  if (fighter.id === 'hisoka') return true
  if (fighter.id === 'chrollo') return bookHasGum(fighter)
  return dolphinHasGum(fighter)
}

export function performGumCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
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
      gumCatch: { frames: 24, hidden: fighter.nen.in },
      blocking: false,
    },
  }
}
function removeGumSeals(state: FightState, side: FightSide): FightState {
  if (!state[side].gumWoundSeals) return state
  return { ...state, [side]: { ...state[side], gumWoundSeals: undefined } }
}
function gumBodyFree(fighter: ArcadeFighter): boolean {
  return canAct(fighter) && !fighter.attack && !fighter.hanzoProjection
}
function bookHasGum(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.chrolloBook?.pages.some(
      (page) =>
        (page === 'hisoka' || chainAbilityGroup(page) === 'bungee-gum') &&
        chrolloHasActivePage(fighter, page),
    ),
  )
}
function dolphinHasGum(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  return Boolean(
    held?.loaded &&
    fighter.kurapika?.emperorTime &&
    chainAbilityGroup(held.moveId) === 'bungee-gum',
  )
}

function sealGumWounds(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const wounds = fighter.openWounds ?? 0
  if (fighter.aura < 10 || wounds <= (fighter.gumWoundSeals ?? 0)) return state
  const paid = spendGumUse(state, side, 10)
  return { ...paid, [side]: { ...paid[side], gumWoundSeals: wounds, arenaRecovery: 18 } }
}

function spendGumUse(state: FightState, side: FightSide, cost: number): FightState {
  const fighter = state[side],
    chain = fighter.kurapika
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: fighter.aura - cost,
      kurapika:
        chain?.held?.source === 'hisoka'
          ? { ...chain, held: { ...chain.held, used: true, sustainedKeys: ['gum-support'] } }
          : chain,
    },
  }
}

function returnCaughtObject(state: FightState, side: FightSide): FightState {
  const fighter = state[side],
    shot = fighter.gumCatch?.projectile
  if (!shot || fighter.aura < 5) return state
  const projectile = {
    ...shot,
    id: state.nextProjectileId,
    owner: side,
    fighterId: fighter.id,
    x: fighter.x + fighter.facing * 3,
    y: fighter.y + 6,
    velocityX: (fighter.gumCatch!.incomingSpeed ?? Math.abs(shot.velocityX)) * fighter.facing,
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
    if (!fighter.gumCatch && !fighter.gumWoundSeals) continue
    const active = ownsBungeeGum(fighter)
    const frames = active ? Math.max(0, (fighter.gumCatch?.frames ?? 0) - 1) : 0
    next = {
      ...next,
      [side]: {
        ...fighter,
        gumWoundSeals: active ? fighter.gumWoundSeals : undefined,
        gumCatch: fighter.gumCatch ? { ...fighter.gumCatch, frames } : undefined,
      },
    }
  }
  return next
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
        'Fenêtre vulnérable et contact frontal avec un objet réel ; la force reçue peut blesser les mains.',
        'Vulnerable window and frontal contact with a real object; the received force can injure the hands.',
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

function releaseGumCatch(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!fighter.gumCatch || fighter.gumCatch.released) return state
  return {
    ...state,
    [side]: { ...fighter, gumCatch: { ...fighter.gumCatch, frames: 0, released: true } },
  }
}

function gumLoanUsed(fighter: ArcadeFighter): boolean {
  return fighter.id === 'kurapika' && Boolean(fighter.kurapika?.held?.used)
}
