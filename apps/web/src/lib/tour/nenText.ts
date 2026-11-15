import type { NenBodyZone } from '$lib/nen/controls'
import type { NenCause } from './nenFeedback'
import type { NenRefusalCode } from './nenRefusal'

type NenLocale = 'en' | 'fr'

const localeOf = (french: boolean): NenLocale => (french ? 'fr' : 'en')

const REFUSALS: Record<NenLocale, Record<NenRefusalCode, string>> = {
  en: {
    RESERVE_TOO_LOW: 'Aura reserve too low: recover in Ten or Zetsu.',
    NODES_SHUT: 'Your nodes are closed: open them with Ten.',
    ZETSU_HAS_NO_AURA: 'Unavailable in Zetsu: no aura is available.',
    RADIUS_MUST_BE_POSITIVE: 'En radius must be greater than zero.',
    RYU_DISTRIBUTION_EMPTY: 'Ryu must assign aura to at least one body zone.',
    ON_FORCES_RYU: 'On imposes its own Ryu distribution.',
  },
  fr: {
    RESERVE_TOO_LOW: 'Réserve d’aura trop basse : reposez-vous en Ten ou en Zetsu.',
    NODES_SHUT: 'Vos nœuds sont fermés : ouvrez-les avec Ten.',
    ZETSU_HAS_NO_AURA: 'Indisponible en Zetsu : aucune aura ne peut être mobilisée.',
    RADIUS_MUST_BE_POSITIVE: 'Le rayon du En doit être strictement positif.',
    RYU_DISTRIBUTION_EMPTY: 'Le Ryu doit répartir l’aura sur au moins une zone du corps.',
    ON_FORCES_RYU: 'On impose sa propre répartition de Ryu.',
  },
}

const SHORT_REFUSALS: Record<NenLocale, Record<NenRefusalCode, string>> = {
  en: {
    RESERVE_TOO_LOW: 'aura reserve too low',
    NODES_SHUT: 'nodes closed',
    ZETSU_HAS_NO_AURA: 'no aura in Zetsu',
    RADIUS_MUST_BE_POSITIVE: 'En radius is not positive',
    RYU_DISTRIBUTION_EMPTY: 'Ryu distribution is empty',
    ON_FORCES_RYU: 'On forces its Ryu distribution',
  },
  fr: {
    RESERVE_TOO_LOW: 'réserve insuffisante',
    NODES_SHUT: 'nœuds fermés',
    ZETSU_HAS_NO_AURA: 'aucune aura en Zetsu',
    RADIUS_MUST_BE_POSITIVE: 'rayon du En non positif',
    RYU_DISTRIBUTION_EMPTY: 'répartition du Ryu vide',
    ON_FORCES_RYU: 'On impose sa répartition de Ryu',
  },
}

export const nenRefusalText = (code: NenRefusalCode, french: boolean, concise = false): string =>
  (concise ? SHORT_REFUSALS : REFUSALS)[localeOf(french)][code]

export interface NenControlText {
  awaken: string
  openNodes: string
  hideRest: string
  aim: string
  hatsuNeedsZetsu: string
  zetsuCloses: string
  action: string
  radius: string
  enRadius: string
  shortcuts: string
  zones: Record<NenBodyZone, string>
}

const CONTROLS: Record<NenLocale, NenControlText> = {
  en: {
    awaken: 'Awaken Nen with Ten.',
    openNodes: 'Open your nodes: other aura becomes perceptible.',
    hideRest: 'Rest Ten: aura stays raised but is no longer shown.',
    aim: 'Aim at an object.',
    hatsuNeedsZetsu: 'This Hatsu requires Zetsu.',
    zetsuCloses: 'Zetsu closes this Hatsu.',
    action: 'Act on object',
    radius: 'Radius',
    enRadius: 'En radius',
    shortcuts: 'T/R/X · G/I/K · −/+ Ryu · 1–4 zones · C Ko · F act · H Hatsu · N En · U Shu',
    zones: { head: 'Head', torso: 'Torso', hands: 'Hands', feet: 'Feet' },
  },
  fr: {
    awaken: 'Éveillez le Nen avec Ten.',
    openNodes: 'Ouvrir vos nœuds : l’aura des autres devient perceptible.',
    hideRest: 'Reposer le Ten : l’aura reste levée, elle cesse de se voir.',
    aim: 'Visez un objet.',
    hatsuNeedsZetsu: 'Ce Hatsu exige le Zetsu.',
    zetsuCloses: 'Le Zetsu ferme ce Hatsu.',
    action: 'Agir sur l’objet',
    radius: 'Rayon',
    enRadius: 'Rayon du En',
    shortcuts: 'T/R/X · G/I/K · −/+ Ryu · 1–4 zones · C Ko · F agir · H Hatsu · N En · U Shu',
    zones: { head: 'Tête', torso: 'Torse', hands: 'Mains', feet: 'Pieds' },
  },
}

export const nenControlText = (french: boolean): NenControlText => CONTROLS[localeOf(french)]

export const nenJournalLabel = (french: boolean): string =>
  french ? 'Journal causal du Nen' : 'Nen cause log'

function frenchCauseText(cause: NenCause): string {
  if (cause.code === 'ACTION_ACCEPTED') return `${cause.action} accepté.`
  if (cause.code === 'ACTION_REFUSED')
    return `${cause.action} refusé : ${nenRefusalText(cause.reason, true, true)}.`
  if (cause.code === 'EN_CONTACT') return `Votre En a touché ${cause.name}.`
  if (cause.code === 'PRESSURE_WITNESS')
    return `${cause.name} a senti votre ${cause.pressure === 'on' ? 'On' : 'Ren'}.`
  if (cause.code === 'EXHAUSTED') return 'Épuisement : retour forcé au Ten.'
  if (cause.code === 'SHU_TRACE') return `Le Shu relâché sur ${cause.objectId} laisse une trace.`
  if (cause.code === 'RUMOR_SPREAD') return `Une rumeur part de ${cause.spaceId}.`
  return `Balayage de sécurité programmé dans ${cause.spaceId}.`
}

function englishCauseText(cause: NenCause): string {
  if (cause.code === 'ACTION_ACCEPTED') return `${cause.action} accepted.`
  if (cause.code === 'ACTION_REFUSED')
    return `${cause.action} refused: ${nenRefusalText(cause.reason, false, true)}.`
  if (cause.code === 'EN_CONTACT') return `Your En touched ${cause.name}.`
  if (cause.code === 'PRESSURE_WITNESS')
    return `${cause.name} felt your ${cause.pressure === 'on' ? 'On' : 'Ren'}.`
  if (cause.code === 'EXHAUSTED') return 'Exhausted: forced back to Ten.'
  if (cause.code === 'SHU_TRACE') return `Released Shu on ${cause.objectId} leaves a trace.`
  if (cause.code === 'RUMOR_SPREAD') return `A rumor spreads from ${cause.spaceId}.`
  return `Security sweep scheduled in ${cause.spaceId}.`
}

export function nenCauseText(cause: NenCause, french: boolean): string {
  return french ? frenchCauseText(cause) : englishCauseText(cause)
}
