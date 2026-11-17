import { performHistoricalCommand } from './chrolloHistoricalAction'
import { chrolloPageForMove } from './chrolloBook'
import { HISTORICAL_CHROLLO_PAGES } from './chrolloHistoricalPages'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function historicalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'chrollo') return []
  const ready = canAct(state[side]) && !state[side].attack && voluntaryNenAvailable(state[side])
  const options: ArsenalOption[] = Object.entries(HISTORICAL_CHROLLO_PAGES).map(
    ([page, label]) => ({
      command: { action: 'history-page', target: page },
      labelFr: `Ouvrir · ${label}`,
      labelEn: `Open · ${label}`,
      ready,
      conditionFr: 'Tourner la page laisse une récupération vulnérable. Le signet reste unique.',
      conditionEn: 'Turning the page leaves vulnerable recovery. Only one bookmark is available.',
    }),
  )
  const page = chrolloPageForMove(state[side])
  const add = (option: HistoricalOption, target?: string) =>
    options.push({
      command: { action: option.action, target },
      labelFr: option.fr,
      labelEn: option.en,
      ready,
      conditionFr: option.condition[0],
      conditionEn: option.condition[1],
    })
  if (page === 'love-dial-6700') addPhoneOptions({ state, side, page, add })
  else addPageOptions({ state, side, page, add })
  if (state[side].chrolloHistorical?.cloth || state[side].chrolloHistorical?.fish)
    add({
      action: 'history-release',
      fr: 'Libérer la cible / les poissons',
      en: 'Release target / fish',
      condition: ['Fin de l’effet maintenu.', 'End the maintained effect.'],
    })
  return options.map((option) => ({
    ...option,
    ready: ready && performHistoricalCommand(state, side, option.command) !== state,
  }))
}

interface HistoricalOption {
  action: ArsenalOption['command']['action']
  fr: string
  en: string
  condition: [string, string]
}
interface PageOptionsContext {
  state: FightState
  side: FightSide
  page: string | null
  add: (option: HistoricalOption, target?: string) => void
}
function addPageOptions({ state, side, page, add }: PageOptionsContext) {
  if (page === 'gallery-fake') {
    const targets = copyTargets(state, side)
    for (const target of targets)
      add(
        {
          action: 'history-use',
          fr: `Gallery Fake · Copier ${target}`,
          en: `Gallery Fake · Copy ${target}`,
          condition: [
            'Toucher à gauche et créer à droite : livre fermé, page au signet. Copie inerte, sans pouvoirs, pendant 24 h.',
            'Touch with the left and create with the right: book closed, page bookmarked. Inert copy, no powers, for 24 hours.',
          ],
        },
        target,
      )
  } else if (page === 'order-stamp') {
    add({
      action: 'history-use',
      fr: 'Order Stamp · Marquer une marionnette',
      en: 'Order Stamp · Stamp a puppet',
      condition: [
        'Contact, tête attachée et ordre prononcé ; pas de cadavre réel.',
        'Contact, attached head and spoken order; no real corpse.',
      ],
    })
    add({
      action: 'history-order-wait',
      fr: 'Marionnettes · Attendre',
      en: 'Puppets · Wait',
      condition: ['Ordre prononcé.', 'Spoken order.'],
    })
    add({
      action: 'history-order-attack',
      fr: 'Marionnettes · Briser la cible',
      en: 'Puppets · Break the target',
      condition: ['Ordre prononcé.', 'Spoken order.'],
    })
  } else if (page === 'convert-hands') {
    add({
      action: 'history-shape-left',
      fr: 'Main gauche · Prendre son apparence',
      en: 'Left hand · Take their appearance',
      condition: [
        'Contact réel ; l’apparence ne copie ni corps ni pouvoirs.',
        'Real contact; appearance copies neither the body nor powers.',
      ],
    })
    add({
      action: 'history-shape-right',
      fr: 'Main droite · Donner mon apparence',
      en: 'Right hand · Give my appearance',
      condition: [
        'Main droite libre : livre fermé et page au signet.',
        'Right hand free: book closed and page bookmarked.',
      ],
    })
    add({
      action: 'history-shape-swap',
      fr: 'Deux mains · Échanger les apparences',
      en: 'Both hands · Swap appearances',
      condition: [
        'Deux mains libres et contact simultané.',
        'Both hands free and simultaneous contact.',
      ],
    })
  } else if (page === 'lovely-ghostwriter')
    add({
      action: 'history-use',
      fr: 'Lovely Ghostwriter · Rédiger une prophétie',
      en: 'Lovely Ghostwriter · Write a fortune',
      condition: [
        'Identité manuscrite complète et futur de scénario requis ; jamais son propre avenir. Ce contexte manque dans le duel actuel.',
        'Complete handwritten identity and a scenario future required; never the caster’s own future. This context is unavailable in the current duel.',
      ],
    })
  else if (page === 'indoor-fish')
    add({
      action: 'history-use',
      fr: 'Indoor Fish · Lâcher les poissons',
      en: 'Indoor Fish · Release the fish',
      condition: [
        'Pièce entièrement close ; les blessures deviennent effectives à la disparition des poissons.',
        'Completely closed room; wounds take effect when the fish disappear.',
      ],
    })
  else if (page === 'fun-fun-cloth')
    add({
      action: 'history-use',
      fr: 'Fun Fun Cloth · Envelopper',
      en: 'Fun Fun Cloth · Wrap',
      condition: [
        'Envelopper physiquement la cible ; deux mains disponibles. La restitution ne cause pas de dégâts.',
        'Physically wrap the target; both hands available. Release causes no damage.',
      ],
    })
  else if (page === 'chrollo-teleportation')
    add({
      action: 'history-use',
      fr: 'Téléportation · Écarter la cible',
      en: 'Teleportation · Relocate the target',
      condition: [
        'Application montrée sur autrui ; conditions complètes inconnues.',
        'Shown application on another person; full conditions unknown.',
      ],
    })
}

function copyTargets(state: FightState, side: FightSide): string[] {
  return [
    side === 'player' ? 'opponent' : 'player',
    ...(state.battlefield?.entities.filter((entry) => entry.present).map((entry) => entry.id) ??
      []),
  ]
}
function addPhoneOptions({ state, side, add }: PageOptionsContext) {
  const target = side === 'player' ? state.opponent : state.player
  add(
    {
      action: 'history-phone-criteria',
      fr: 'Love Dial · Chercher ce profil de Nen',
      en: 'Love Dial · Search this Nen profile',
      condition: [
        'Saisir des critères dans le téléphone conjuré avant de composer.',
        'Enter criteria in the conjured phone before dialing.',
      ],
    },
    `ability:${target.id}`,
  )
  add({
    action: 'history-phone-call',
    fr: 'Love Dial · Composer le numéro',
    en: 'Love Dial · Dial the number',
    condition: [
      'Quota quotidien limité, valeur canonique inconnue. Deux appels par jour dans ce scénario de duel.',
      'Limited daily quota; the canonical value is unknown. Two calls per day in this duel scenario.',
    ],
  })
}
