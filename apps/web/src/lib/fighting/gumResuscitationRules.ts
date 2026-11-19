import type { ArcadeFighter } from './types'
import type { AsphyxiaCertificate, GumResuscitationProgram } from './gumResuscitationTypes'

/** Cinematic pacing and preparation cost are duel tuning, not manga durations. */
export const GUM_RESUSCITATION_FRAMES = 120
export const GUM_RESUSCITATION_COST = 8

export function viableAsphyxia(certificate?: AsphyxiaCertificate): boolean {
  if (!certificate) return false
  return [
    certificate.cause === 'asphyxia',
    certificate.heartIntact,
    certificate.lungsIntact,
    certificate.airwayClear,
    certificate.oxygenRestored,
    certificate.viable,
    Number.isFinite(certificate.traumaHealth) && certificate.traumaHealth > 0,
  ].every(Boolean)
}
export function matchingResuscitationBody(options: {
  body: ArcadeFighter
  key: string
  program?: GumResuscitationProgram
  certificate?: AsphyxiaCertificate
}): boolean {
  const { body, key, program, certificate } = options
  return [
    body.id === 'hisoka',
    (body.nenOwner ?? body.id) === 'hisoka',
    !body.halkenburgSoul,
    !body.halkenburgPassenger,
    !body.hanzoProjection,
    program?.bodyKey === key,
    certificate?.bodyKey === key,
    program?.order === 'heart-and-lungs',
    Boolean(certificate && certificate.traumaHealth <= body.maxHealth),
  ].every(Boolean)
}
