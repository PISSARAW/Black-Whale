import { gyoSight } from './nenPerception'
import { addThetaHandgun } from './thetaFigure'
import { shapeFightEyes } from './fightFigureEyes'
import { addChrolloBook } from './chrolloFigure'
import { addFranklinHands } from './franklinHands'
import { franklinFightProfile, shapeFranklinFigure } from './franklinFigure'
import { buildHumanFigure, type HumanFigureBuild, type HumanLook } from '$lib/tour/humanFigure'
import { humanProfile } from '$lib/tour/humanProfiles'
import { fighterAuraHex } from './auraColours'
import { biscuitTrueFormProfile, shapeBiscuitTrueForm } from './biscuitFigure'
import { isBiscuitTrueForm } from './biscuitForm'
import { fighterDefinition } from './roster'
import type { ArcadeFighter } from './types'

/** Geometry state only: attacks and movement animate the existing model. */
export function fightFigureKey(fighter: ArcadeFighter): string {
  return JSON.stringify([
    fighter.nen,
    Boolean(fighter.parallelEyesClosed),
    'hanzoProjection' in fighter && Boolean(fighter.hanzoProjection),
    isBiscuitTrueForm(fighter),
    Boolean(fighter.textureSurprise),
    Boolean(fighter.kurapika?.emperorTime),
  ])
}

export function buildFightFigure(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  fighter: ArcadeFighter
  observer?: ArcadeFighter
}) {
  const { THREE, glow, fighter } = options
  const definition = fighterDefinition(fighter.id)
  const seen: HumanLook = {
    id: `fighting-scene:${definition.modelId}`,
    kind: 'combatant',
    spaceId: 'black-whale-clash',
    tierId: 'arcade-stage',
    at: [0, 0],
    y: 0,
    size: 1,
    colour: fighterAuraHex(fighter.id),
    stage: 0,
    hidden: false,
    human: {
      role: definition.modelRole,
      identity: definition.modelId,
      pose: 'idle',
      aura: fighter.nen.mode,
      nen: { ...fighter.nen, en: null },
    },
  }
  const declared = humanProfile(seen)
  const profile = fighter.id === 'franklin' ? franklinFightProfile(declared) : declared
  const trueForm = isBiscuitTrueForm(fighter)
  // Texture Surprise changes only a flat cloth panel's appearance.
  const dressed = fighter.textureSurprise ? { ...profile, shirt: profile.skin } : profile
  const model = buildHumanFigure({
    THREE,
    auraStyle: 'visitor',
    observerSight: observerSight(options.observer),
    glow:
      'hanzoProjection' in fighter && fighter.hanzoProjection
        ? (colour, opacity) => glow(colour, opacity * 0.28)
        : glow,
    seen,
    profile: trueForm ? biscuitTrueFormProfile(dressed) : dressed,
  })
  if (trueForm) shapeBiscuitTrueForm(model)

  addFighterEquipment(options, model)
  shapeFightEyes({ root: model.root, fighter, glow })
  return model
}

function addFighterEquipment(
  options: Parameters<typeof buildFightFigure>[0],
  model: ReturnType<typeof buildHumanFigure>,
): void {
  const { THREE, glow, fighter } = options
  if (fighter.id === 'franklin') {
    shapeFranklinFigure({ THREE, glow, model })
    addFranklinHands({ THREE, glow, model })
  }
  if (fighter.id === 'chrollo') addChrolloBook({ THREE, glow, model })
  if (fighter.id === 'theta') addThetaHandgun({ THREE, glow, model })
}

function observerSight(observer?: ArcadeFighter): 'gyo' | 'sight' {
  return observer && gyoSight(observer) ? 'gyo' : 'sight'
}
