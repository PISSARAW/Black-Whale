import { addBenjaminRifle } from './benjaminRifle'
import { wardrobePalette, wardrobeProfile } from './presentation/wardrobe'
import type { Palette } from './presentation/collection'
import { addHanzoProjectionMantle } from '$lib/tour/mangaHanzoProjection'
import { addKallutoPaper } from './kallutoFigure'
import { paperDolls } from './kallutoSurveillance'
import { addPadailleWeapon } from './padailleFigure'
import { illumiFaceProfile, addIllumiNeedles } from './illumiFigure'
import { addBonolenovPrologue, battleFigureKey } from './bonolenovFigure'
import { battleAppearance } from './battleCantabileRules'
import { blinkyAvailable } from './blinky'
import { addBlinky } from './blinkyFigure'
import { addMussePistol } from './mussePistol'
import { improveFightFace } from './fightFaceReadability'
import { shapeFightEyes } from './fightFigureEyes'
import { addBodyguardPistol } from './bodyguardFigure'
import { registerFightExpression } from './fightExpressionRig'
import { gyoSight } from './nenPerception'
import { addThetaHandgun } from './thetaFigure'
import { buildHumanFigure, type HumanFigureBuild, type HumanLook } from '$lib/tour/humanFigure'
import { humanProfile } from '$lib/tour/humanProfiles'
import { fighterAuraHex } from './auraColours'
import { addFranklinHands } from './franklinHands'
import { addChrolloBook } from './chrolloFigure'
import { franklinFightProfile, shapeFranklinFigure } from './franklinFigure'
import { biscuitTrueFormProfile, shapeBiscuitTrueForm } from './biscuitFigure'
import { isBiscuitTrueForm } from './biscuitForm'
import { fighterDefinition } from './roster'
import type { ArcadeFighter } from './types'

/** Geometry state only: attacks and movement animate the existing model. */
export function fightFigureKey(fighter: ArcadeFighter): string {
  return JSON.stringify([
    // En is drawn by the effect scene, never by this figure (see buildFightFigure).
    { ...fighter.nen, en: null },
    fighter.plantedPaper,
    paperDolls(fighter).length,
    Boolean(fighter.illumi?.disguised),
    ...historicalFigureKey(fighter),
    Boolean(fighter.needlePuppet?.needleEmbedded),
    ...battleFigureKey(fighter),
    blinkyAvailable(fighter),
    fighter.hanzoProjection ? fighter.hanzoProjection.startupFrames > 0 : null,
    Boolean(fighter.parallelEyesClosed),
    isBiscuitTrueForm(fighter),
    Boolean(fighter.textureSurprise),
    Boolean(fighter.kurapika?.emperorTime),
    fighter.battleCantabile?.form?.model,
    Boolean(fighter.battleCantabile?.prologue),
    Boolean(fighter.battleCantabile?.preparation),
  ])
}

export function buildFightFigure(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  fighter: ArcadeFighter
  observer?: ArcadeFighter
  /** Reference captures can compare the unchanged shared model. */
  readability?: boolean
  palette?: Palette
}) {
  const { THREE, glow, fighter } = options
  const definition = fighterDefinition(battleAppearance(fighter))
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
  const profile = illumiFaceProfile(
    fighter.id === 'franklin' ? franklinFightProfile(declared) : declared,
    fighter,
  )
  const trueForm = isBiscuitTrueForm(fighter)
  // Texture Surprise changes only a flat cloth panel's appearance.
  const dressed = figureClothing(profile, fighter)
  const finalProfile = wardrobeProfile(
    trueForm ? biscuitTrueFormProfile(dressed) : dressed,
    wardrobePalette(fighter, options.palette ?? 'native'),
  )
  const figureGlow: HumanFigureBuild['glow'] = fighter.hanzoProjection
    ? (colour, opacity) => glow(colour, opacity * 0.28)
    : glow
  const model = buildHumanFigure({
    THREE,
    auraStyle: 'visitor',
    observerSight: observerSight(options.observer),
    glow: figureGlow,
    seen,
    profile: finalProfile,
  })
  if (options.readability !== false) improveFightFace(model, finalProfile)
  if (trueForm) shapeBiscuitTrueForm(model)
  if (fighter.clothCapture) model.root.scale.multiplyScalar(0.08)

  addIllumiNeedles({ THREE, glow, fighter, model })
  addFighterEquipment(options, model)
  addKallutoPaper({ THREE, glow, fighter, model })
  shapeFightEyes({ root: model.root, fighter, glow })
  registerFightExpression({ THREE, model, fighter })
  return model
}

function observerSight(observer?: ArcadeFighter): 'gyo' | 'sight' {
  return observer && gyoSight(observer) ? 'gyo' : 'sight'
}

function addFighterEquipment(
  options: Parameters<typeof buildFightFigure>[0],
  model: ReturnType<typeof buildHumanFigure>,
): void {
  const { THREE, glow, fighter } = options
  addBodyguardPistol({ THREE, glow, fighter, model })
  addBonolenovPrologue({ THREE, glow, fighter, model })
  addHanzoActivation(options, model)
  if (['padaille', 'chrollo', 'kurapika'].includes(fighter.id))
    addPadailleWeapon({ THREE, glow, model })
  if (fighter.id === 'franklin') {
    shapeFranklinFigure({ THREE, glow, model })
    addFranklinHands({ THREE, glow, model })
  }
  if (fighter.id === 'chrollo') addChrolloBook({ THREE, glow, model })
  if (fighter.id === 'benjamin') addBenjaminRifle({ THREE, glow, model })
  if (fighter.id === 'musse') addMussePistol({ THREE, glow, model })
  if (fighter.id === 'theta') addThetaHandgun({ THREE, glow, model })
  if (blinkyAvailable(fighter)) addBlinky({ THREE, glow, model })
}

function addHanzoActivation(
  options: Parameters<typeof buildFightFigure>[0],
  model: ReturnType<typeof buildHumanFigure>,
) {
  const { THREE, glow, fighter } = options
  if (fighter.id === 'hanzo' && (fighter.hanzoProjection?.startupFrames ?? 0) > 0)
    addHanzoProjectionMantle({ THREE, glow, model })
}

function historicalFigureKey(fighter: ArcadeFighter) {
  return [fighter.chrolloHistorical?.appearance?.model, Boolean(fighter.clothCapture)]
}
function figureClothing(profile: ReturnType<typeof humanProfile>, fighter: ArcadeFighter) {
  return fighter.textureSurprise ||
    fighter.battleCantabile?.preparation ||
    fighter.battleCantabile?.prologue
    ? { ...profile, shirt: profile.skin }
    : profile
}
