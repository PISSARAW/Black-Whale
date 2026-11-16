import type { FightStageId } from './stages'
import type { StageBackgroundDefinition } from './stageBackgroundTypes'
import type { BackgroundElement, BackgroundMedium } from './stageBackgroundSceneTypes'
import { STAGE_BACKGROUND_SCENES } from './stageBackgroundScenes'
import { BACKGROUND_EVENT_CAPTIONS } from './stageBackgroundEventCaptions'

interface DescriptionContext {
  stage: FightStageId
  definition: StageBackgroundDefinition
  participants: readonly string[]
  language: 'fr' | 'en'
}
const MEDIA: Record<BackgroundMedium, { fr: string; en: string }> = {
  poster: {
    fr: 'Une affiche illustrée est suspendue dans le décor.',
    en: 'An illustrated poster hangs in the scenery.',
  },
  portrait: {
    fr: 'Un portrait encadré est accroché dans la pièce.',
    en: 'A framed portrait hangs in the room.',
  },
  graffiti: {
    fr: 'Un dessin est peint au pochoir sur une caisse.',
    en: 'A drawing is stencilled on a crate.',
  },
  'floor-mark': {
    fr: 'Un motif discret est peint directement sur le sol.',
    en: 'A discreet motif is painted straight on the floor.',
  },
  monitor: {
    fr: 'Un écran de tournoi affiche un emblème de Hunter.',
    en: 'A tournament screen displays a Hunter emblem.',
  },
}
const OBJECTS: Record<StageBackgroundDefinition['secret']['motif'], { fr: string; en: string }> = {
  boat: {
    fr: 'Un bateau de papier est caché dans le décor.',
    en: 'A paper boat is hidden in the scenery.',
  },
  spider: {
    fr: 'Une minuscule araignée se cache au bord d’une caisse.',
    en: 'A tiny spider hides on the edge of a crate.',
  },
  card: {
    fr: 'Une carte abandonnée attend un regard attentif.',
    en: 'An abandoned playing card awaits a careful look.',
  },
  cat: {
    fr: 'Une petite figurine de chat veille sur la pièce.',
    en: 'A little cat figurine watches over the room.',
  },
  reel: {
    fr: 'Une bobine de cinéma a quitté sa réserve.',
    en: 'A film reel has escaped its storage.',
  },
  spring: {
    fr: 'Un petit ressort se cache parmi les accessoires.',
    en: 'A little spring hides among the accessories.',
  },
  toy: {
    fr: 'Un jouet en forme de baleine a été oublié au sol.',
    en: 'A whale toy has been left on the floor.',
  },
  feather: {
    fr: 'Une plume dorée se cache à l’écart du duel.',
    en: 'A golden feather hides away from the duel.',
  },
  coin: {
    fr: 'Un jeton s’est échappé de sa collection.',
    en: 'A chip has escaped its collection.',
  },
  cup: { fr: 'Une tasse de thé attend son propriétaire.', en: 'A teacup awaits its owner.' },
}
function elementDescription(element: BackgroundElement, context: DescriptionContext): string {
  const { language, definition, participants } = context
  if (element.kind === 'art') return MEDIA[element.medium][language]
  if (element.kind === 'event') return BACKGROUND_EVENT_CAPTIONS[element.event][language]
  if (element.kind === 'object') return OBJECTS[element.object][language]
  const names = element.people
    .map(({ actor }) => {
      const person = definition.spectators[actor]
      if (participants.includes(person.identity))
        return language === 'fr' ? 'un passager' : 'a passenger'
      return person.name
    })
    .join(', ')
  return language === 'fr' ? `Dans le public : ${names}.` : `In the audience: ${names}.`
}
export function describeStageBackground(context: DescriptionContext): string {
  return STAGE_BACKGROUND_SCENES[context.stage]
    .map((element) => elementDescription(element, context))
    .join(' ')
}
