import { buildBiohazardCuffs } from '$lib/tour/biohazardCuffsModel'
import { buildEmittedFist } from '$lib/tour/emittedFistModel'
import { buildGrimmelArrow, buildRisingSun } from '$lib/tour/emittedHatsuModels'
import { buildObjectApparition } from '$lib/tour/apparitionObjectView'
import { buildBasicApparition } from '$lib/tour/apparitionBasicView'
import { buildMangaPropApparition } from '$lib/tour/apparitionMangaPropView'
import { buildSnakeApparition } from '$lib/tour/apparitionSnakeView'
import { buildAntennaApparition } from '$lib/tour/antennaModel'
import { buildCrossGameCard } from '$lib/tour/crossGameCardModel'
import type { Apparition, ApparitionKind } from '$lib/tour/apparitions'
import type { BasicApparitionContext } from '$lib/tour/apparitionBasicView'

type Build = (seen: Apparition, context: BasicApparitionContext) => unknown
const source = (kind: ApparitionKind, colour: number, build: Build) => ({
  apparitionKind: kind, colour, stage: 0, build,
})
export const EXTRA_VISIT_MODELS = {
  'paper-doll': source('paper', 0xefe7d9, buildObjectApparition),
  'sun-mark': source('sun-mark', 0xffcc55, buildBasicApparition),
  'moon-mark': source('moon-mark', 0xc7d9e9, buildBasicApparition),
  'bungee-gum': source('gum', 0xf06bb5, buildObjectApparition),
  'priest-staff': source('staff', 0x4a3934, buildMangaPropApparition),
  'snake-arm': source('snake', 0xcdaa9c, buildSnakeApparition),
  'black-voice-antenna': source('antenna', 0x9ebaa8, buildAntennaApparition),
  'biohazard-cuffs': source('animal-object', 0xaaaeb3, buildBiohazardCuffs),
  'controlled-bird': source('bird', 0x8f9ba7, buildBasicApparition),
  'cross-game-card': source('card', 0xf0c94d, (seen, context) => {
    const face = buildCrossGameCard(context.THREE, { size: seen.size, index: seen.stage, glow: context.glow })
    face.material.side = context.THREE.DoubleSide
    context.root.add(face)
  }),
  'emitted-fist': source('mark', 0xbcecff, (_seen, context) => context.root.add(
    buildEmittedFist(context.THREE, context.skin))),
  'grimmel-arrow': source('mark', 0xf7e27d, (_seen, context) => context.root.add(
    buildGrimmelArrow(context.THREE, context.skin))),
  'rising-sun': source('mark', 0xfff3b4, (_seen, context) => context.root.add(
    buildRisingSun(context.THREE, context.skin))),
}
