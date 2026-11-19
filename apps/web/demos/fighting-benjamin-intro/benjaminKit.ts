import { Shot } from '../fighting-chrollo-intro/reel'

/**
 * Benjamin's closing shot: Benjamin Baton named for what it is (his fallen soldiers'
 * inherited Hatsu), then his Guardian Spirit Beast rising on him. The beast has no combat
 * role in Clash; the video stages the Nen archive's own model behind his shoulders.
 */
type Scene = () => Shot

const guardian: Scene = () => {
  const s = new Shot('benjamin-salon', 'franklin', { gap: 20, hero: 'benjamin' })
  s.step(6)
  s.portrait('tower', 200)
  s.beat('BENJAMIN BATON', 'Three fallen soldiers. Three inherited Hatsu.')
  s.step(40)
  s.summon('benjamin-guardian', 60)
  s.beat('GUARDIAN SPIRIT BEAST', 'The royal parasite stands behind him')
  s.step(150)
  return s
}

export const KIT_SCENES = { guardian }
